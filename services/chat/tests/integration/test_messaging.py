from sqlalchemy import select, func
from models.messages import Message
from services.chat_service import generate_dm_key
from tests.integration.conftest import poll_db, run_async


# alice sends message to bob → bob receives it in real-time, message persisted in DB
def test_send_message_both_online(client, make_token, test_session_factory):
    alice_token = make_token("alice", "alice@test.com")
    bob_token = make_token("bob", "bob@test.com")

    with client.websocket_connect(f"/server/ws/?token={alice_token}") as alice_ws:
        alice_ws.receive_json()  # user_list
        alice_ws.receive_json()  # user_joined (self)

        with client.websocket_connect(f"/server/ws/?token={bob_token}") as bob_ws:
            bob_ws.receive_json()  # user_list
            bob_ws.receive_json()  # user_joined (self)
            alice_ws.receive_json()  # user_joined for bob

            alice_ws.send_json({"type": "message", "to": "bob", "message": "hello bob"})

            # bob receives the message in real-time
            msg = bob_ws.receive_json()
            assert msg["type"] == "message"
            assert msg["message"] == "hello bob"
            assert msg["from_id"] == "alice"
            assert msg["from"] == "alice@test.com"

    # message persisted in DB via Kafka (may take a moment)
    async def check(session):
        count = (await session.execute(select(func.count()).select_from(Message))).scalar()
        return count > 0

    run_async(poll_db(test_session_factory, check))


# alice sends message when bob is disconnected → message persisted, no crash
def test_send_message_recipient_offline(client, make_token, test_session_factory):
    alice_token = make_token("alice", "alice@test.com")
    bob_token = make_token("bob", "bob@test.com")

    # bob connects first so his User row exists, then disconnects
    with client.websocket_connect(f"/server/ws/?token={bob_token}") as bob_ws:
        bob_ws.receive_json()  # user_list
        bob_ws.receive_json()  # user_joined (self)

    with client.websocket_connect(f"/server/ws/?token={alice_token}") as alice_ws:
        alice_ws.receive_json()  # user_list
        alice_ws.receive_json()  # user_joined (self)

        # bob is disconnected — send a message anyway
        alice_ws.send_json({"type": "message", "to": "bob", "message": "are you there?"})

        # no crash — alice can still use the connection
        alice_ws.send_json({"type": "chat_list"})
        msg = alice_ws.receive_json()
        assert msg["type"] == "chat_list"

    # message still persisted via Kafka
    async def check(session):
        count = (await session.execute(select(func.count()).select_from(Message))).scalar()
        return count > 0

    run_async(poll_db(test_session_factory, check))


# alice sends messages, then loads history → correct messages returned in order
def test_load_history(client, make_token, test_session_factory):
    alice_token = make_token("alice", "alice@test.com")
    bob_token = make_token("bob", "bob@test.com")

    with client.websocket_connect(f"/server/ws/?token={alice_token}") as alice_ws:
        alice_ws.receive_json()  # user_list
        alice_ws.receive_json()  # user_joined (self)

        with client.websocket_connect(f"/server/ws/?token={bob_token}") as bob_ws:
            bob_ws.receive_json()  # user_list
            bob_ws.receive_json()  # user_joined (self)
            alice_ws.receive_json()  # user_joined for bob

            # send a few messages
            for i in range(3):
                alice_ws.send_json({"type": "message", "to": "bob", "message": f"msg-{i}"})
                bob_ws.receive_json()  # bob receives each message

            # wait for Kafka consumer to persist
            async def check(session):
                count = (await session.execute(select(func.count()).select_from(Message))).scalar()
                return count >= 3

            run_async(poll_db(test_session_factory, check))

            # load history
            dm_key = generate_dm_key("alice", "bob")
            alice_ws.send_json({"type": "load_history", "dm_key": dm_key})
            history = alice_ws.receive_json()

            assert history["type"] == "load_history"
            assert len(history["messages"]) == 3
            messages = [m["message"] for m in history["messages"]]
            assert messages == ["msg-0", "msg-1", "msg-2"]


# alice sends file_upload → bob receives it with the URL
def test_file_upload(client, make_token):
    alice_token = make_token("alice", "alice@test.com")
    bob_token = make_token("bob", "bob@test.com")

    with client.websocket_connect(f"/server/ws/?token={alice_token}") as alice_ws:
        alice_ws.receive_json()  # user_list
        alice_ws.receive_json()  # user_joined (self)

        with client.websocket_connect(f"/server/ws/?token={bob_token}") as bob_ws:
            bob_ws.receive_json()  # user_list
            bob_ws.receive_json()  # user_joined (self)
            alice_ws.receive_json()  # user_joined for bob

            alice_ws.send_json({"type": "file_upload", "to": "bob", "url": "https://cdn.example.com/pic.png"})

            msg = bob_ws.receive_json()
            assert msg["type"] == "file_upload"
            assert msg["message"] == "https://cdn.example.com/pic.png"
            assert msg["from_id"] == "alice"
