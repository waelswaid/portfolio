import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from connection_manager import manager
from dispatch.registry import get_handler
from dispatch.context import RequestContext

logger = logging.getLogger(__name__)
from core.auth_token import validate_token
from services.user_db_service import upsert_user
from database import async_session

websocket_router = APIRouter()


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
            try:
                data = await websocket.receive_json()
            except ValueError:
                await websocket.send_json({"type": "error", "message": "invalid JSON"})
                continue

            msg_type = data.get("type")
            # returns function based on msg_type from _registry
            handler = get_handler(msg_type)
            if handler is None:
                await websocket.send_json({"type": "error", "message": "unknown type"})
                continue # <- restarts loop jumps back to while true

            ctx = RequestContext(user_id=user_id, user_email=user_email, websocket=websocket, data=data)
            try:
                await handler(ctx)
            except Exception:
                logger.exception("handler '%s' failed for user %s", msg_type, user_id)
                try:
                    await websocket.send_json({"type": "error", "message": "internal error"})
                except Exception:
                    pass
    except (WebSocketDisconnect, RuntimeError):
        # WebSocketDisconnect: normal close (browser tab closed, network drop)
        # RuntimeError: websocket died unexpectedly (e.g. replaced by another connection)
        pass
    except Exception:
        logger.exception("unexpected error in WebSocket handler for user %s", user_id)
    finally:
        await manager.disconnect(user_id, websocket)
