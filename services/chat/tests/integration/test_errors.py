# unknown message type → error response, connection stays alive for next message
def test_unknown_message_type(client, make_token):
    token = make_token("alice", "alice@test.com")
    with client.websocket_connect(f"/server/ws/?token={token}") as ws:
        ws.receive_json()  # user_list

        ws.send_json({"type": "nonexistent_type"})
        msg = ws.receive_json()
        assert msg["type"] == "error"
        assert msg["message"] == "unknown type"

        # connection still alive — send another valid-shaped message
        ws.send_json({"type": "chat_list"})
        msg = ws.receive_json()
        assert msg["type"] == "chat_list"


# invalid payload (missing required fields) → error response, connection stays alive
def test_invalid_message_payload(client, make_token):
    token = make_token("alice", "alice@test.com")
    with client.websocket_connect(f"/server/ws/?token={token}") as ws:
        ws.receive_json()  # user_list

        # message handler expects 'to' and 'message' fields
        ws.send_json({"type": "message"})
        msg = ws.receive_json()
        assert msg["type"] == "message_error"
        assert "invalid payload" in msg["message"]

        # connection still alive
        ws.send_json({"type": "chat_list"})
        msg = ws.receive_json()
        assert msg["type"] == "chat_list"
