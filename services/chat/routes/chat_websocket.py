import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from connection_manager import manager

logger = logging.getLogger(__name__)
from schemas.message import Message, LoadHistory
from schemas.file_message import FileMessage
from core.auth_token import validate_token
from services.friend_service import friend_request_handler
from services.user_db_service import upsert_user
from database import async_session
from services.chat_service import chat_handler, load_chat, chat_list
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError

websocket_router = APIRouter()

# incoming requests are either text message, file upload or friend request
async def request_filter(data, msg_type:str, user_id:str, user_email, websocket:WebSocket):
    
    if msg_type == "message":
        # pydantic validation and deserialization
        # data comes in as a raw dict --> pydantic validates each field against type annotations -> produces typed Message instance
        try:
            message_model = Message(**data)
        except ValidationError:
            await websocket.send_json({"type": "message_error", "message": "invalid payload"})
            return
        message, message_to = message_model.message, message_model.to
        try:
            await chat_handler(msg_type, message, user_id, message_to)
            await manager.send_personal_message(msg_type, message_to, message, user_id)
        except SQLAlchemyError:
            await websocket.send_json({"type": "message_error", "message": "failed to send"})

    elif msg_type == "file_upload":
        # frontend sends --> {"type":"upload_file", "to":"to_id", "url":"url"}
        try:
            file_received = FileMessage(**data)
        except ValidationError:
            await websocket.send_json({"type": "message_error", "message": "invalid payload"})
            return
        file_to, file_url = file_received.to, file_received.url
        try:
            await chat_handler(msg_type, file_url, user_id, file_to)
            await manager.send_personal_message(msg_type, file_to, file_url, user_id)
        except SQLAlchemyError:
            await websocket.send_json({"type": "message_error", "message": "failed to send"})

    elif msg_type == "load_history":
        try:
            load_history = LoadHistory(**data)
        except ValidationError:
            await websocket.send_json({"type": "load_history_error", "message": "invalid payload"})
            return
        dm_key = load_history.dm_key
        before_message_id = load_history.before
        await websocket.send_json(await load_chat(dm_key, before_message_id, user_id))

    elif msg_type == "chat_list":
        await websocket.send_json(await chat_list(user_id))

    else:
        await friend_request_handler(msg_type,data,websocket,user_id,user_email)

# extract token from websocket -> validate token -> upsert user -> broadcast and return
async def auth_conn_user(websocket: WebSocket) -> tuple[str, str] | None:
    # extract token
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        # validate and extract user_id, user_email
        user_id, user_email = validate_token(token)
    except Exception:
        await websocket.close(code=1008)
        return
    # upsert user to database
    async with async_session() as session:
        await upsert_user(session, user_id, user_email)
    # connect user — returns True if reconnecting during grace period
    reconnected = await manager.connect(websocket, user_id, user_email)
    try:
        # send online users list to user
        await websocket.send_json({
            "type": "user_list",
            "users": manager.get_online_users()
        })
        # only broadcast join if this is a fresh connection, not a grace period reconnect
        if not reconnected:
            await manager.broadcast({"type": "user_joined", "user_id": user_id, "email": user_email})
    except Exception:
        await manager.disconnect(user_id, websocket)
        return None

    return user_id, user_email


@websocket_router.websocket("/ws/")
async def route_to_server(websocket: WebSocket):
    try:
        user_data = await auth_conn_user(websocket)
    except Exception:
        # auth failed after connect() was called — clean up the zombie entry
        try:
            await websocket.close()
        except Exception:
            pass
        return
    if not user_data:
        return
    user_id, user_email = user_data

    try:
        # core loop
        while True:
            # listen for incoming requests
            data = await websocket.receive_json()
            msg_type = data.get("type")
            await request_filter(data, msg_type, user_id, user_email, websocket)
    except (WebSocketDisconnect, RuntimeError):
        # WebSocketDisconnect: normal close (browser tab closed, network drop)
        # RuntimeError: websocket died unexpectedly (e.g. replaced by another connection)
        pass
    except Exception:
        logger.exception("unexpected error in WebSocket handler for user %s", user_id)
    finally:
        await manager.disconnect(user_id, websocket)