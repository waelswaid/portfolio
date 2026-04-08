import pytest
from services.notification_service import NotificationService


@pytest.fixture
def notification_service(session_factory):
    return NotificationService(session_factory)


async def test_create_notification(notification_service, create_user):
    await create_user("alice", "alice@test.com")
    nid = await notification_service.create(
        "alice", "friend_request_received", {"from_user": "bob", "email": "bob@test.com"}
    )
    assert isinstance(nid, int)


async def test_get_unread(notification_service, create_user):
    await create_user("alice", "alice@test.com")
    await notification_service.create(
        "alice", "friend_request_received", {"from_user": "bob", "email": "bob@test.com"}
    )
    unread = await notification_service.get_unread("alice")
    assert len(unread) == 1
    assert unread[0]["type"] == "friend_request_received"
    assert unread[0]["payload"]["from_user"] == "bob"


async def test_get_unread_returns_only_unread(notification_service, create_user):
    await create_user("alice", "alice@test.com")
    nid = await notification_service.create(
        "alice", "friend_request_received", {"from_user": "bob", "email": "bob@test.com"}
    )
    await notification_service.create(
        "alice", "friend_request_accepted", {"user_id": "carol", "email": "carol@test.com"}
    )
    await notification_service.mark_read("alice", [nid])
    unread = await notification_service.get_unread("alice")
    assert len(unread) == 1
    assert unread[0]["type"] == "friend_request_accepted"


async def test_mark_read(notification_service, create_user):
    await create_user("alice", "alice@test.com")
    nid = await notification_service.create(
        "alice", "friend_request_received", {"from_user": "bob", "email": "bob@test.com"}
    )
    count = await notification_service.mark_read("alice", [nid])
    assert count == 1
    unread = await notification_service.get_unread("alice")
    assert len(unread) == 0


async def test_mark_read_guards_user_id(notification_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    nid = await notification_service.create(
        "alice", "friend_request_received", {"from_user": "bob", "email": "bob@test.com"}
    )
    # bob should not be able to mark alice's notification as read
    count = await notification_service.mark_read("bob", [nid])
    assert count == 0
    # alice's notification is still unread
    unread = await notification_service.get_unread("alice")
    assert len(unread) == 1


async def test_get_unread_empty(notification_service, create_user):
    await create_user("alice", "alice@test.com")
    unread = await notification_service.get_unread("alice")
    assert unread == []
