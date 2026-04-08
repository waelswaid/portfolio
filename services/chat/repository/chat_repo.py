from sqlalchemy import delete, or_, and_, select, func
from models.chats import Chat
from models.chat_members import ChatMember
from models.messages import Message
from models.users import User


async def query_chats_for_existing_chat(session, dm_key:str) -> str | None:
    # select chat_id from chats where dm_key = dm_key
    result = (await session.execute(
        select(Chat.chat_id).where(Chat.dm_key == dm_key)
    )).scalars().first()
    return result

# chat: chat_name, created_at, is_group, dm_key
async def insert_new_chat(session, chat: Chat):
    session.add(chat)

async def insert_users_to_chat_members(session, user1:ChatMember, user2:ChatMember):
    session.add(user1)
    session.add(user2)

async def insert_message(session, message:Message):
    session.add(message)


async def load_messages(session, chat_id:str, before_message_id:int|None):
    query = select(Message).where(Message.chat_id == chat_id)
    if before_message_id is not None:
        query = query.where(Message.message_id < before_message_id)                 
    query = query.order_by(Message.message_id.desc()).limit(10)
    return (await session.execute(query)).scalars().all()


async def is_chat_member(session, chat_id: str, user_id: str) -> bool:
    result = (await session.execute(
        select(ChatMember.user_id)
        .where(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id)
    )).scalars().first()
    return result is not None


async def get_user_chats(session, user_id: str):
    # get all chat_ids the user is a member of
    my_chats = select(ChatMember.chat_id).where(ChatMember.user_id == user_id).subquery()

    # for each chat, get the other member's user_id and email
    other_member = (await session.execute(
        select(ChatMember.chat_id, ChatMember.user_id, User.email)
        .join(User, ChatMember.user_id == User.id)
        .where(ChatMember.chat_id.in_(select(my_chats.c.chat_id)), ChatMember.user_id != user_id)
    )).all()

    # get the last message per chat using a lateral/correlated subquery
    # simpler approach: get all chat_ids, then fetch last message for each
    chat_ids = [row.chat_id for row in other_member]
    if not chat_ids:
        return []

    # get dm_key for each chat
    chats = (await session.execute(
        select(Chat.chat_id, Chat.dm_key).where(Chat.chat_id.in_(chat_ids))
    )).all()
    dm_key_map = {row.chat_id: row.dm_key for row in chats}

    # get last message for each chat
    last_msg_subq = (
        select(Message.chat_id, func.max(Message.message_id).label("max_id"))
        .where(Message.chat_id.in_(chat_ids))
        .group_by(Message.chat_id)
        .subquery()
    )
    last_messages = (await session.execute(
        select(Message)
        .join(last_msg_subq, and_(Message.chat_id == last_msg_subq.c.chat_id, Message.message_id == last_msg_subq.c.max_id))
    )).scalars().all()
    last_msg_map = {m.chat_id: m for m in last_messages}

    result = []
    for row in other_member:
        last_msg = last_msg_map.get(row.chat_id)
        result.append({
            "chat_id": row.chat_id,
            "dm_key": dm_key_map.get(row.chat_id),
            "other_user_id": row.user_id,
            "other_user_email": row.email,
            "last_message": {
                "message": last_msg.message,
                "type": last_msg.type,
                "timestamp": str(last_msg.timestamp),
                "user_id": last_msg.user_id,
            } if last_msg else None,
        })
    return result