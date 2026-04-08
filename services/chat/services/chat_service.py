import logging
import uuid
from repository.chat_repo import (
    query_chats_for_existing_chat, insert_message, insert_new_chat, insert_users_to_chat_members,
    load_messages, is_chat_member, get_user_chats)
from models.chats import Chat
from models.chat_members import ChatMember
from models.messages import Message
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


def generate_dm_key(sender_id: str, receiver_id: str):
    return min(sender_id, receiver_id) + ":" + max(sender_id, receiver_id)


class ChatService:
    def __init__(self, session_factory):
        self._session_factory = session_factory

    async def ensure_chat_exists(self, sender_id: str, receiver_id: str) -> str:
        dm_key = generate_dm_key(sender_id, receiver_id)
        async with self._session_factory() as session:
            try:
                chat_id = await query_chats_for_existing_chat(session, dm_key)
                if not chat_id:
                    chat_id = str(uuid.uuid4())
                    chat = Chat(chat_id=chat_id, chat_name=None, is_group=False, dm_key=dm_key)
                    member1 = ChatMember(chat_id=chat_id, user_id=sender_id, is_admin=False)
                    member2 = ChatMember(chat_id=chat_id, user_id=receiver_id, is_admin=False)
                    await insert_new_chat(session, chat)
                    await session.flush()
                    await insert_users_to_chat_members(session, member1, member2)
                    await session.commit()
                return chat_id
            except SQLAlchemyError as e:
                logger.error("ensure_chat_exists failed: %s", e)
                await session.rollback()
                raise

    async def persist_message(self, msg_type: str, message: str, sender_id: str, chat_id: str):
        async with self._session_factory() as session:
            try:
                message_orm = Message(chat_id=chat_id, user_id=sender_id, message=message, type=msg_type)
                await insert_message(session, message_orm)
                await session.commit()
            except SQLAlchemyError as e:
                logger.error("persist_message failed: %s", e)
                await session.rollback()
                raise

    async def load_chat(self, dm_key: str, before_message_id: int | None, user_id: str):
        async with self._session_factory() as session:
            chat_id = await query_chats_for_existing_chat(session, dm_key)
            if not chat_id:
                return {"type": "load_history", "dm_key": dm_key, "messages": []}
            result = await is_chat_member(session, chat_id, user_id)
            if not result:
                return {"type": "message_error", "message": "unauthorized chat"}
            messages = await load_messages(session, chat_id, before_message_id)
            return {"type": "load_history", "dm_key": dm_key, "messages": [
                {"message_id": m.message_id, "user_id": m.user_id, "message": m.message, "type": m.type, "timestamp": m.timestamp.isoformat()}
                for m in reversed(messages)]}

    async def chat_list(self, user_id: str):
        async with self._session_factory() as session:
            chats = await get_user_chats(session, user_id)
            return {"type": "chat_list", "chats": chats}
