import pytest


# valid token → receives user_list with the connected user
def test_connect_valid_token(client, make_token):
    token = make_token("alice", "alice@test.com")
    with client.websocket_connect(f"/server/ws/?token={token}") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "user_list"
        user_ids = [u["user_id"] for u in msg["users"]]
        assert "alice" in user_ids


# invalid token → connection closed with code 1008
def test_connect_invalid_token(client):
    with pytest.raises(Exception):
        with client.websocket_connect("/server/ws/?token=garbage") as ws:
            ws.receive_json()


# no token → connection closed with code 1008
def test_connect_no_token(client):
    with pytest.raises(Exception):
        with client.websocket_connect("/server/ws/") as ws:
            ws.receive_json()
