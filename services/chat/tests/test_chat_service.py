import pytest
from sqlalchemy import select, func
from services.chat_service import ChatService, generate_dm_key
from models.chats import Chat
from models.chat_members import ChatMember
from models.messages import Message


@pytest.fixture
def chat_service(session_factory):
    return ChatService(session_factory)


# ── ensure_chat_exists ──


# creates a new chat and two chat_member rows when no chat exists
async def test_ensure_chat_exists_creates_new_chat(chat_service, session_factory, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    chat_id = await chat_service.ensure_chat_exists("alice", "bob")

    assert chat_id is not None
    async with session_factory() as session:
        chat = (await session.execute(select(Chat).where(Chat.chat_id == chat_id))).scalar_one()
        assert chat.dm_key == generate_dm_key("alice", "bob")
        assert chat.is_group is False

        members = (await session.execute(
            select(ChatMember.user_id).where(ChatMember.chat_id == chat_id)
        )).scalars().all()
        assert sorted(members) == ["alice", "bob"]


# returns the same chat_id on second call (idempotent)
async def test_ensure_chat_exists_returns_existing(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    chat_id_1 = await chat_service.ensure_chat_exists("alice", "bob")
    chat_id_2 = await chat_service.ensure_chat_exists("alice", "bob")

    assert chat_id_1 == chat_id_2


# (alice, bob) and (bob, alice) produce the same chat
async def test_ensure_chat_exists_canonical_dm_key(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    chat_id_1 = await chat_service.ensure_chat_exists("alice", "bob")
    chat_id_2 = await chat_service.ensure_chat_exists("bob", "alice")

    assert chat_id_1 == chat_id_2


# ── persist_message ──


# message ends up in the database with correct fields
async def test_persist_message(chat_service, session_factory, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    chat_id = await chat_service.ensure_chat_exists("alice", "bob")

    await chat_service.persist_message("message", "hello", "alice", chat_id)

    async with session_factory() as session:
        msg = (await session.execute(select(Message).where(Message.chat_id == chat_id))).scalar_one()
        assert msg.message == "hello"
        assert msg.type == "message"
        assert msg.user_id == "alice"


# raises on non-existent chat_id (FK violation)
async def test_persist_message_fk_violation(chat_service):
    with pytest.raises(Exception):
        await chat_service.persist_message("message", "hello", "nobody", "fake-chat-id")


# ── load_chat ──


# returns messages in chronological order
async def test_load_chat_returns_messages(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    chat_id = await chat_service.ensure_chat_exists("alice", "bob")
    dm_key = generate_dm_key("alice", "bob")

    for i in range(3):
        await chat_service.persist_message("message", f"msg-{i}", "alice", chat_id)

    result = await chat_service.load_chat(dm_key, None, "alice")

    assert result["type"] == "load_history"
    assert len(result["messages"]) == 3
    # messages should be in chronological order (oldest first)
    assert result["messages"][0]["message"] == "msg-0"
    assert result["messages"][2]["message"] == "msg-2"


# before_message_id returns the next batch of older messages
async def test_load_chat_pagination(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    chat_id = await chat_service.ensure_chat_exists("alice", "bob")
    dm_key = generate_dm_key("alice", "bob")

    for i in range(15):
        await chat_service.persist_message("message", f"msg-{i}", "alice", chat_id)

    # first page: latest 10
    page1 = await chat_service.load_chat(dm_key, None, "alice")
    assert len(page1["messages"]) == 10

    # second page: before the oldest message in page1
    oldest_id = page1["messages"][0]["message_id"]
    page2 = await chat_service.load_chat(dm_key, oldest_id, "alice")
    assert len(page2["messages"]) == 5


# returns empty messages list for a dm_key that doesn't exist
async def test_load_chat_nonexistent_dm_key(chat_service, create_user):
    await create_user("alice", "alice@test.com")

    result = await chat_service.load_chat("nonexistent:key", None, "alice")

    assert result["type"] == "load_history"
    assert result["messages"] == []


# returns error for a user who is not a member of the chat
async def test_load_chat_unauthorized(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    await create_user("charlie", "charlie@test.com")
    chat_id = await chat_service.ensure_chat_exists("alice", "bob")
    dm_key = generate_dm_key("alice", "bob")

    await chat_service.persist_message("message", "secret", "alice", chat_id)

    result = await chat_service.load_chat(dm_key, None, "charlie")

    assert result["type"] == "message_error"
    assert "unauthorized" in result["message"]


# verifies pagination returns different messages, not the same page twice
async def test_load_chat_pagination_content(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    chat_id = await chat_service.ensure_chat_exists("alice", "bob")
    dm_key = generate_dm_key("alice", "bob")

    for i in range(15):
        await chat_service.persist_message("message", f"msg-{i}", "alice", chat_id)

    page1 = await chat_service.load_chat(dm_key, None, "alice")
    oldest_id = page1["messages"][0]["message_id"]
    page2 = await chat_service.load_chat(dm_key, oldest_id, "alice")

    page1_messages = [m["message"] for m in page1["messages"]]
    page2_messages = [m["message"] for m in page2["messages"]]
    # no overlap between pages
    assert set(page1_messages).isdisjoint(set(page2_messages))
    # page2 has the oldest messages
    assert page2_messages[0] == "msg-0"


# messages from both users in a chat appear in load_chat
async def test_load_chat_both_users(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    chat_id = await chat_service.ensure_chat_exists("alice", "bob")
    dm_key = generate_dm_key("alice", "bob")

    await chat_service.persist_message("message", "hi from alice", "alice", chat_id)
    await chat_service.persist_message("message", "hi from bob", "bob", chat_id)

    result = await chat_service.load_chat(dm_key, None, "alice")

    assert len(result["messages"]) == 2
    senders = {m["user_id"] for m in result["messages"]}
    assert senders == {"alice", "bob"}


# ── chat_list ──


# returns user's chats with other user info and last message
async def test_chat_list(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    await create_user("charlie", "charlie@test.com")

    chat_id_1 = await chat_service.ensure_chat_exists("alice", "bob")
    chat_id_2 = await chat_service.ensure_chat_exists("alice", "charlie")
    await chat_service.persist_message("message", "hi bob", "alice", chat_id_1)
    await chat_service.persist_message("message", "hi charlie", "alice", chat_id_2)

    result = await chat_service.chat_list("alice")

    assert result["type"] == "chat_list"
    chats = result["chats"]
    assert len(chats) == 2
    other_emails = sorted(c["other_user_email"] for c in chats)
    assert other_emails == ["bob@test.com", "charlie@test.com"]


# returns last_message content for each chat
async def test_chat_list_last_message(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    chat_id = await chat_service.ensure_chat_exists("alice", "bob")
    await chat_service.persist_message("message", "first", "alice", chat_id)
    await chat_service.persist_message("message", "second", "alice", chat_id)

    result = await chat_service.chat_list("alice")

    chat = result["chats"][0]
    assert chat["last_message"] is not None
    assert chat["last_message"]["message"] == "second"
    assert chat["last_message"]["type"] == "message"


# returns chat with no messages (last_message should be None)
async def test_chat_list_no_messages(chat_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    await chat_service.ensure_chat_exists("alice", "bob")

    result = await chat_service.chat_list("alice")

    assert len(result["chats"]) == 1
    assert result["chats"][0]["last_message"] is None


# returns empty list for a user with no chats
async def test_chat_list_empty(chat_service, create_user):
    await create_user("alice", "alice@test.com")

    result = await chat_service.chat_list("alice")

    assert result["type"] == "chat_list"
    assert result["chats"] == []
