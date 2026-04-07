from repository.friend_system_repo import (
    send_friend_req_to_db, friend_request_accept_to_db,
    friend_req_decline_to_db, friend_remove_from_db,
    get_friend_list_from_db, get_pending_list_from_db
)
from sqlalchemy.exc import IntegrityError, SQLAlchemyError


class FriendService:
    def __init__(self, session_factory):
        self._session_factory = session_factory

    # TODO: before inserting, check if already friends or if a reverse pending request (receiver→sender) exists
    async def send_friend_request(self, to: str, sender_id: str, sender_email: str) -> dict:
        async with self._session_factory() as session:
            try:
                await send_friend_req_to_db(session, to, sender_id)
                await session.commit()
            except IntegrityError:
                await session.rollback()
                return {"response": {"type": "send_friend_req_error", "message": "invalid request"}}
        return {
            "response": {"type": "friend_request_sent", "to": to},
            "notify": [(to, {"type": "friend_request_received", "from_user": sender_id, "email": sender_email})],
        }

    async def friend_request_accept(self, requester_id: str, accepter_id: str, accepter_email: str) -> dict:
        async with self._session_factory() as session:
            try:
                await friend_request_accept_to_db(session, requester_id, accepter_id)
                await session.commit()
            except (IntegrityError, ValueError):
                await session.rollback()
                return {"response": {"type": "friend_req_accept_error", "message": "invalid request"}}
        return {
            "response": {"type": "friend_request_accepted", "from": requester_id},
            "notify": [(requester_id, {"type": "friend_request_accepted", "user_id": accepter_id, "email": accepter_email})],
        }

    async def friend_request_declined(self, requester_id: str, decliner_id: str) -> dict:
        async with self._session_factory() as session:
            try:
                await friend_req_decline_to_db(session, requester_id, decliner_id)
                await session.commit()
            except (IntegrityError, ValueError):
                await session.rollback()
                return {"response": {"type": "friend_req_decline_error", "message": "invalid request"}}
        return {
            "response": {"type": "friend_request_declined", "from": requester_id},
            "notify": [(requester_id, {"type": "friend_request_declined", "user_id": decliner_id})],
        }

    async def friend_remove(self, removed_id: str, remover_id: str) -> dict:
        async with self._session_factory() as session:
            try:
                await friend_remove_from_db(session, removed_id, remover_id)
                await session.commit()
            except (IntegrityError, ValueError):
                await session.rollback()
                return {"response": {"type": "friend_remove_error", "message": "invalid request"}}
        return {
            "response": {"type": "friend_removed", "user_id": removed_id},
            "notify": [(removed_id, {"type": "friend_removed", "user_id": remover_id})],
        }

    async def return_friend_list(self, user_id: str) -> dict:
        async with self._session_factory() as session:
            try:
                friends = await get_friend_list_from_db(session, user_id)
                return {"response": {"type": "friend_list", "friends": friends}}
            except SQLAlchemyError:
                return {"response": {"type": "friend_list_error", "message": "invalid request"}}

    async def return_pending_list(self, user_id: str) -> dict:
        async with self._session_factory() as session:
            try:
                pending = await get_pending_list_from_db(session, user_id)
                return {"response": {"type": "pending_list", "sent": pending["sent"], "received": pending["received"]}}
            except SQLAlchemyError:
                return {"response": {"type": "pending_list_error", "message": "invalid request"}}
