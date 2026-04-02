from schemas.friend_request import FriendRequest, FriendAccept,FriendDecline, FriendRemove
from fastapi import WebSocket
from database import async_session
from repository.friend_system_repo import (
    send_friend_req_to_db, friend_request_accept_to_db,
    friend_req_decline_to_db, friend_remove_from_db,
    get_friend_list_from_db, get_pending_list_from_db
) 
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from connection_manager import manager
from pydantic import ValidationError



# TODO: before inserting, check if already friends or if a reverse pending request (receiver→sender) exists
async def send_friend_request(req : FriendRequest, websocket:WebSocket, user_id: str, user_email: str) -> None:
    to = req.to
    sender_id = user_id
    async with async_session() as session:
        try:
            await send_friend_req_to_db(session,to,sender_id)
        except IntegrityError:
            await session.rollback()
            await websocket.send_json({"type":"send_friend_req_error", "message":"invalid request"})
            return
    await websocket.send_json({"type": "friend_request_sent", "to": req.to})
    # notify receiver if online
    receiver_ws = manager.get_connection(req.to)
    if receiver_ws:
        try:
            await receiver_ws.send_json({"type": "friend_request_received", "from_user": user_id, "email": user_email})
        except Exception:
            pass
    return
    


async def friend_request_accept(req : FriendAccept, websocket:WebSocket, accepter_id: str, accepter_email: str) -> None:
    requester_id = req.from_user
    async with async_session() as session:
        try:
            await friend_request_accept_to_db(session, requester_id, accepter_id)
        except (IntegrityError, ValueError):
            await session.rollback()
            await websocket.send_json({"type":"friend_req_accept_error", "message":"invalid request"})
            return
    await websocket.send_json({"type": "friend_request_accepted", "from": req.from_user})
    # notify original requester if online
    requester_ws = manager.get_connection(requester_id)
    if requester_ws:
        try:
            await requester_ws.send_json({"type": "friend_request_accepted", "user_id": accepter_id, "email": accepter_email})
        except Exception:
            pass
    return
    

async def friend_request_declined(req : FriendDecline, websocket:WebSocket, decliner_id: str) -> None:
    requester_id = req.from_user
    async with async_session() as session:
        try:
            await friend_req_decline_to_db(session, requester_id, decliner_id)
        except(IntegrityError, ValueError):
            await session.rollback()
            await websocket.send_json({"type":"friend_req_decline_error", "message":"invalid request"})
            return
    await websocket.send_json({"type": "friend_request_declined", "from": req.from_user})
    # notify original requester if online
    requester_ws = manager.get_connection(requester_id)
    if requester_ws:
        try:
            await requester_ws.send_json({"type": "friend_request_declined", "user_id": decliner_id})
        except Exception:
            pass
    return
        
async def friend_remove(req: FriendRemove, websocket : WebSocket, remover_id: str):
    removed_id = req.user_id
    async with async_session() as session:
        try:
            await friend_remove_from_db(session, removed_id,remover_id)
        except (IntegrityError, ValueError):
            await session.rollback()
            await websocket.send_json({"type":"friend_remove_error", "message":"invalid request"})
            return
    await websocket.send_json({"type": "friend_removed", "user_id": req.user_id})
    # notify removed friend if online
    removed_ws = manager.get_connection(removed_id)
    if removed_ws:
        try:
            await removed_ws.send_json({"type": "friend_removed", "user_id": remover_id})
        except Exception:
            pass
    return
        

async def return_friend_list(websocket: WebSocket, user_id: str):
    async with async_session() as session:
        try:
            friends = await get_friend_list_from_db(session, user_id)
            await websocket.send_json({"type": "friend_list", "friends": friends})
        except SQLAlchemyError:
            await websocket.send_json({"type": "friend_list_error", "message": "invalid request"})
            return
        

async def return_pending_list(websocket: WebSocket, user_id: str):
    async with async_session() as session:
        try:
            pending = await get_pending_list_from_db(session, user_id)
            await websocket.send_json({"type": "pending_list", "sent": pending["sent"], "received": pending["received"]})
        except SQLAlchemyError:
            await websocket.send_json({"type": "pending_list_error", "message": "invalid request"})
            return



# a user connected at chat_websocket.py, user_id, user_email, and websocket were passed here
async def friend_request_handler(msg_type:str, data:dict, websocket:WebSocket, user_id:str, user_email:str):
    try:
        if msg_type == "friend_request":
            req = FriendRequest(**data)
            await send_friend_request(req, websocket, user_id, user_email)
        elif msg_type == "friend_accept":
            req = FriendAccept(**data)
            await friend_request_accept(req, websocket, user_id, user_email)
        elif msg_type == "friend_decline":
            req = FriendDecline(**data)
            await friend_request_declined(req, websocket, user_id)
        elif msg_type == "friend_remove":
            req = FriendRemove(**data)
            await friend_remove(req, websocket, user_id)
        elif msg_type == "friend_list":
            await return_friend_list(websocket, user_id)
        elif msg_type == "pending_list":
            await return_pending_list(websocket, user_id)
        else:
            await websocket.send_json({"type": "error", "message": "unknown type"})
    except ValidationError:
        await websocket.send_json({"type": "error", "message": "invalid payload"})