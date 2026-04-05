import logging
from database import async_session

logger = logging.getLogger(__name__)
from repository.chat_repo import (
    query_chats_for_existing_chat, insert_message, insert_new_chat, insert_users_to_chat_members,
    load_messages, is_chat_member, get_user_chats)
from models.chats import Chat
from models.chat_members import ChatMember
from models.messages import Message
import uuid
from sqlalchemy.exc import SQLAlchemyError


def generate_dm_key(sender_id:str, receiver_id:str):
    return min(sender_id, receiver_id) + ":" + max(sender_id, receiver_id)

# sync chat/member creation before produce
async def ensure_chat_exists(sender_id: str, receiver_id: str) -> str:
    """ensures chat exists between two users. returns the chat_id"""
    dm_key = generate_dm_key(sender_id, receiver_id)
    async with async_session() as session:
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
            logger.error(f"ensure_chat_exists failed: {e}")
            await session.rollback()
            raise


async def send_message(msg_type: str, message: str, sender_id: str, receiver_id: str):
    """Orchestrates message sending: ensure chat exists, produce to Kafka, deliver to recipient."""
    from kafka.producer import producer
    from connection_manager import manager
    chat_id = await ensure_chat_exists(sender_id, receiver_id)
    try:
        await producer.produce(msg_type, message, sender_id, receiver_id, chat_id)
    except Exception:
        logger.warning("Kafka produce failed, falling back to direct DB write", exc_info=True)
        await chat_handler(msg_type, message, sender_id, receiver_id, chat_id)
    await manager.send_personal_message(msg_type, receiver_id, message, sender_id)


async def chat_handler(msg_type:str, message:str,  sender_id:str, receiver_id:str, chat_id: str | None = None):
   # insert a message into an existing chat. Used by Kafka consumer and as producer fallback
    if not chat_id:
        chat_id = await ensure_chat_exists(sender_id, receiver_id)
    async with async_session() as session:
        try:
            message_orm = Message(chat_id=chat_id, user_id=sender_id, message=message, type=msg_type)
            await insert_message(session, message_orm)
            await session.commit()
        except SQLAlchemyError as e:
            logger.error(f"chat_handler failed: {e}")
            await session.rollback()
            raise



async def load_chat(dm_key: str, before_message_id:int|None, user_id:str):
    async with async_session() as session:
        chat_id = await query_chats_for_existing_chat(session, dm_key)
        if not chat_id:
            return {"type": "load_history", "dm_key": dm_key, "messages": []}
        result = await is_chat_member(session, chat_id, user_id)
        if not result:
            return {"type": "message_error", "message": "unauthorized chat"}
        messages = await load_messages(session, chat_id, before_message_id)
        return {"type": "load_history", "dm_key": dm_key, "messages": [
            {"message_id": m.message_id, "user_id": m.user_id, "message": m.message, "type": m.type, "timestamp": str(m.timestamp)}
            for m in reversed(messages)]}


async def chat_list(user_id: str):
    async with async_session() as session:
        chats = await get_user_chats(session, user_id)
        return {"type": "chat_list", "chats": chats}