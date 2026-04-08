import pytest
from pydantic import ValidationError
from services.chat_service import generate_dm_key
from schemas.message import Message, LoadHistory
from schemas.file_message import FileMessage
from schemas.friend_request import FriendRequest, FriendAccept, FriendDecline, FriendRemove
from schemas.chat_event import ChatMessageEvent


# ── generate_dm_key ──


# produces a deterministic key regardless of argument order
def test_dm_key_is_order_independent():
    assert generate_dm_key("alice", "bob") == generate_dm_key("bob", "alice")


# key format is "smaller:larger" sorted lexicographically
def test_dm_key_format():
    key = generate_dm_key("zebra", "alpha")
    assert key == "alpha:zebra"


# identical user ids produce "id:id"
def test_dm_key_same_user():
    key = generate_dm_key("alice", "alice")
    assert key == "alice:alice"


# ── Message schema ──


# accepts valid payload with required fields
def test_message_valid():
    msg = Message(to="bob", message="hello")
    assert msg.to == "bob"
    assert msg.message == "hello"


# rejects missing 'to' field
def test_message_missing_to():
    with pytest.raises(ValidationError):
        Message(message="hello")


# rejects missing 'message' field
def test_message_missing_message():
    with pytest.raises(ValidationError):
        Message(to="bob")


# ── LoadHistory schema ──


# accepts payload with optional 'before' field omitted
def test_load_history_without_before():
    lh = LoadHistory(dm_key="alice:bob")
    assert lh.dm_key == "alice:bob"
    assert lh.before is None


# accepts payload with 'before' field provided
def test_load_history_with_before():
    lh = LoadHistory(dm_key="alice:bob", before=42)
    assert lh.before == 42


# rejects missing dm_key
def test_load_history_missing_dm_key():
    with pytest.raises(ValidationError):
        LoadHistory()


# ── FileMessage schema ──


# accepts valid payload
def test_file_message_valid():
    fm = FileMessage(to="bob", url="https://cdn.example.com/file.png")
    assert fm.to == "bob"
    assert fm.url == "https://cdn.example.com/file.png"


# rejects missing url
def test_file_message_missing_url():
    with pytest.raises(ValidationError):
        FileMessage(to="bob")


# ── FriendRequest schemas ──


# FriendRequest accepts valid payload
def test_friend_request_valid():
    req = FriendRequest(to="bob", type="friend_request")
    assert req.to == "bob"


# FriendRequest rejects missing 'to'
def test_friend_request_missing_to():
    with pytest.raises(ValidationError):
        FriendRequest()


# FriendAccept accepts valid payload
def test_friend_accept_valid():
    req = FriendAccept(from_user="alice", type="friend_accept")
    assert req.from_user == "alice"


# FriendDecline accepts valid payload
def test_friend_decline_valid():
    req = FriendDecline(from_user="alice", type="friend_decline")
    assert req.from_user == "alice"


# FriendRemove accepts valid payload
def test_friend_remove_valid():
    req = FriendRemove(user_id="alice", type="friend_remove")
    assert req.user_id == "alice"


# FriendRemove rejects missing user_id
def test_friend_remove_missing_user_id():
    with pytest.raises(ValidationError):
        FriendRemove()


# WSMessage base ignores extra fields (ConfigDict extra="ignore")
def test_friend_request_ignores_extra_fields():
    req = FriendRequest(to="bob", type="friend_request", foo="bar", baz=123)
    assert req.to == "bob"
    assert not hasattr(req, "foo")


# ── ChatMessageEvent schema ──


# accepts valid kafka event payload
def test_chat_message_event_valid():
    event = ChatMessageEvent(
        msg_type="message", message="hello",
        sender_id="alice", receiver_id="bob", chat_id="chat-123",
    )
    assert event.msg_type == "message"
    assert event.sender_id == "alice"


# rejects incomplete kafka event payload
def test_chat_message_event_missing_fields():
    with pytest.raises(ValidationError):
        ChatMessageEvent(msg_type="message", message="hello")


# ── handler registry ──


# registers and retrieves a handler by message type
def test_registry_register_and_get():
    from dispatch.registry import _registry, get_handler

    async def fake_handler(ctx):
        pass

    _registry["__test_type__"] = fake_handler
    assert get_handler("__test_type__") is fake_handler
    del _registry["__test_type__"]


# returns None for unregistered message type
def test_registry_get_unknown():
    from dispatch.registry import get_handler
    assert get_handler("__nonexistent__") is None


# handles decorator rejects duplicate registration
def test_registry_duplicate_raises():
    from dispatch.registry import _registry, handles

    @handles("__test_dup__")
    async def first(ctx):
        pass

    with pytest.raises(ValueError, match="duplicate"):
        @handles("__test_dup__")
        async def second(ctx):
            pass

    del _registry["__test_dup__"]
