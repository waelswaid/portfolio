import pytest
from sqlalchemy import select, func
from services.friend_service import FriendService
from models.pending_requests import PendingRequests
from models.friendships import Friendships


@pytest.fixture
def friend_service(session_factory):
    return FriendService(session_factory)


# ── send_friend_request ──


# creates a pending request and returns notify payload targeting the recipient
async def test_send_friend_request(friend_service, session_factory, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    result = await friend_service.send_friend_request("bob", "alice", "alice@test.com")

    assert result["response"]["type"] == "friend_request_sent"
    assert result["response"]["to"] == "bob"
    assert result["notify"][0][0] == "bob"
    assert result["notify"][0][1]["type"] == "friend_request_received"

    async with session_factory() as session:
        count = (await session.execute(
            select(func.count()).select_from(PendingRequests)
        )).scalar()
        assert count == 1


# returns error on duplicate friend request (IntegrityError on composite PK)
async def test_send_friend_request_duplicate(friend_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    await friend_service.send_friend_request("bob", "alice", "alice@test.com")
    result = await friend_service.send_friend_request("bob", "alice", "alice@test.com")

    assert result["response"]["type"] == "send_friend_req_error"


# rejected by CHECK constraint (sender_id != receiver_id)
async def test_send_friend_request_to_self(friend_service, create_user):
    await create_user("alice", "alice@test.com")

    result = await friend_service.send_friend_request("alice", "alice", "alice@test.com")

    assert "error" in result["response"]["type"]


# FK violation when recipient doesn't exist
async def test_send_friend_request_nonexistent_user(friend_service, create_user):
    await create_user("alice", "alice@test.com")

    result = await friend_service.send_friend_request("ghost", "alice", "alice@test.com")

    assert "error" in result["response"]["type"]


# ── friend_request_accept ──


# removes pending request, creates bidirectional friendship, notifies requester
async def test_friend_request_accept(friend_service, session_factory, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    await friend_service.send_friend_request("bob", "alice", "alice@test.com")
    result = await friend_service.friend_request_accept("alice", "bob", "bob@test.com")

    assert result["response"]["type"] == "friend_request_accepted"
    assert result["notify"][0][0] == "alice"

    async with session_factory() as session:
        pending = (await session.execute(
            select(func.count()).select_from(PendingRequests)
        )).scalar()
        assert pending == 0

        friendships = (await session.execute(
            select(func.count()).select_from(Friendships)
        )).scalar()
        assert friendships == 2


# returns error when accepting without a prior pending request
async def test_friend_request_accept_no_pending(friend_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    result = await friend_service.friend_request_accept("alice", "bob", "bob@test.com")

    assert "error" in result["response"]["type"]


# ── friend_request_declined ──


# removes pending request, no friendship created
async def test_friend_request_declined(friend_service, session_factory, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    await friend_service.send_friend_request("bob", "alice", "alice@test.com")
    result = await friend_service.friend_request_declined("alice", "bob")

    assert result["response"]["type"] == "friend_request_declined"

    async with session_factory() as session:
        pending = (await session.execute(
            select(func.count()).select_from(PendingRequests)
        )).scalar()
        assert pending == 0

        friendships = (await session.execute(
            select(func.count()).select_from(Friendships)
        )).scalar()
        assert friendships == 0


# returns error when declining without a prior pending request
async def test_friend_request_decline_no_pending(friend_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    result = await friend_service.friend_request_declined("alice", "bob")

    assert "error" in result["response"]["type"]


# ── friend_remove ──


# removes both friendship rows
async def test_friend_remove(friend_service, session_factory, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    await friend_service.send_friend_request("bob", "alice", "alice@test.com")
    await friend_service.friend_request_accept("alice", "bob", "bob@test.com")

    result = await friend_service.friend_remove("bob", "alice")

    assert result["response"]["type"] == "friend_removed"

    async with session_factory() as session:
        friendships = (await session.execute(
            select(func.count()).select_from(Friendships)
        )).scalar()
        assert friendships == 0


# returns error when removing users who are not friends
async def test_friend_remove_not_friends(friend_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")

    result = await friend_service.friend_remove("bob", "alice")

    assert "error" in result["response"]["type"]


# ── return_friend_list ──


# returns correct friends after accepting requests
async def test_return_friend_list(friend_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    await create_user("charlie", "charlie@test.com")

    await friend_service.send_friend_request("bob", "alice", "alice@test.com")
    await friend_service.friend_request_accept("alice", "bob", "bob@test.com")
    await friend_service.send_friend_request("charlie", "alice", "alice@test.com")
    await friend_service.friend_request_accept("alice", "charlie", "charlie@test.com")

    result = await friend_service.return_friend_list("alice")

    friends = result["response"]["friends"]
    assert len(friends) == 2
    friend_ids = sorted(f["user_id"] for f in friends)
    assert friend_ids == ["bob", "charlie"]


# returns empty list for a user with no friends
async def test_return_friend_list_empty(friend_service, create_user):
    await create_user("alice", "alice@test.com")

    result = await friend_service.return_friend_list("alice")

    assert result["response"]["friends"] == []


# ── return_pending_list ──


# correctly separates sent and received pending requests
async def test_return_pending_list(friend_service, create_user):
    await create_user("alice", "alice@test.com")
    await create_user("bob", "bob@test.com")
    await create_user("charlie", "charlie@test.com")

    # alice sends to bob
    await friend_service.send_friend_request("bob", "alice", "alice@test.com")
    # charlie sends to alice
    await friend_service.send_friend_request("alice", "charlie", "charlie@test.com")

    result = await friend_service.return_pending_list("alice")

    resp = result["response"]
    assert resp["type"] == "pending_list"
    assert len(resp["sent"]) == 1
    assert resp["sent"][0]["user_id"] == "bob"
    assert len(resp["received"]) == 1
    assert resp["received"][0]["user_id"] == "charlie"


# returns empty sent and received lists when no pending requests exist
async def test_return_pending_list_empty(friend_service, create_user):
    await create_user("alice", "alice@test.com")

    result = await friend_service.return_pending_list("alice")

    resp = result["response"]
    assert resp["sent"] == []
    assert resp["received"] == []
