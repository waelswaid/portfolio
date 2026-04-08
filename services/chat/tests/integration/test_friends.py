from sqlalchemy import select, func
from models.pending_requests import PendingRequests
from models.friendships import Friendships
from tests.integration.conftest import run_async


def _query_count(session_factory, model):
    """Helper to synchronously query a row count."""
    async def _run():
        async with session_factory() as session:
            return (await session.execute(select(func.count()).select_from(model))).scalar()
    return run_async(_run())


# alice sends friend request → bob gets real-time notification, pending row exists in DB
def test_friend_request_and_notification(client, make_token, test_session_factory):
    alice_token = make_token("alice", "alice@test.com")
    bob_token = make_token("bob", "bob@test.com")

    with client.websocket_connect(f"/server/ws/?token={alice_token}") as alice_ws:
        alice_ws.receive_json()  # user_list
        alice_ws.receive_json()  # user_joined (self)

        with client.websocket_connect(f"/server/ws/?token={bob_token}") as bob_ws:
            bob_ws.receive_json()  # user_list
            bob_ws.receive_json()  # user_joined (self)
            alice_ws.receive_json()  # user_joined for bob

            alice_ws.send_json({"type": "friend_request", "to": "bob"})

            # alice gets confirmation
            alice_msg = alice_ws.receive_json()
            assert alice_msg["type"] == "friend_request_sent"
            assert alice_msg["to"] == "bob"

            # bob gets real-time notification
            bob_msg = bob_ws.receive_json()
            assert bob_msg["type"] == "friend_request_received"
            assert bob_msg["from_user"] == "alice"

    # pending request exists in DB
    assert _query_count(test_session_factory, PendingRequests) == 1


# bob accepts alice's friend request → friendship created, pending removed
def test_friend_accept(client, make_token, test_session_factory):
    alice_token = make_token("alice", "alice@test.com")
    bob_token = make_token("bob", "bob@test.com")

    with client.websocket_connect(f"/server/ws/?token={alice_token}") as alice_ws:
        alice_ws.receive_json()  # user_list
        alice_ws.receive_json()  # user_joined (self)

        with client.websocket_connect(f"/server/ws/?token={bob_token}") as bob_ws:
            bob_ws.receive_json()  # user_list
            bob_ws.receive_json()  # user_joined (self)
            alice_ws.receive_json()  # user_joined for bob

            # alice sends friend request
            alice_ws.send_json({"type": "friend_request", "to": "bob"})
            alice_ws.receive_json()  # friend_request_sent
            bob_ws.receive_json()  # friend_request_received

            # bob accepts
            bob_ws.send_json({"type": "friend_accept", "from_user": "alice"})

            # bob gets confirmation
            bob_msg = bob_ws.receive_json()
            assert bob_msg["type"] == "friend_request_accepted"

            # alice gets notification
            alice_msg = alice_ws.receive_json()
            assert alice_msg["type"] == "friend_request_accepted"
            assert alice_msg["user_id"] == "bob"

    # friendship created, pending removed
    assert _query_count(test_session_factory, PendingRequests) == 0
    assert _query_count(test_session_factory, Friendships) == 2


# alice removes bob as friend → friendship rows deleted
def test_friend_remove(client, make_token, test_session_factory):
    alice_token = make_token("alice", "alice@test.com")
    bob_token = make_token("bob", "bob@test.com")

    with client.websocket_connect(f"/server/ws/?token={alice_token}") as alice_ws:
        alice_ws.receive_json()  # user_list
        alice_ws.receive_json()  # user_joined (self)

        with client.websocket_connect(f"/server/ws/?token={bob_token}") as bob_ws:
            bob_ws.receive_json()  # user_list
            bob_ws.receive_json()  # user_joined (self)
            alice_ws.receive_json()  # user_joined for bob

            # become friends first
            alice_ws.send_json({"type": "friend_request", "to": "bob"})
            alice_ws.receive_json()  # friend_request_sent
            bob_ws.receive_json()  # friend_request_received

            bob_ws.send_json({"type": "friend_accept", "from_user": "alice"})
            bob_ws.receive_json()  # friend_request_accepted (bob)
            alice_ws.receive_json()  # friend_request_accepted (alice)

            # alice removes bob
            alice_ws.send_json({"type": "friend_remove", "user_id": "bob"})
            alice_msg = alice_ws.receive_json()
            assert alice_msg["type"] == "friend_removed"

    # friendship gone
    assert _query_count(test_session_factory, Friendships) == 0
