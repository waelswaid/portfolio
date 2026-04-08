# alice connects first, then bob connects → alice receives user_joined broadcast for bob
def test_user_joined_broadcast(client, make_token):
    alice_token = make_token("alice", "alice@test.com")
    bob_token = make_token("bob", "bob@test.com")

    with client.websocket_connect(f"/server/ws/?token={alice_token}") as alice_ws:
        alice_ws.receive_json()  # alice's user_list

        with client.websocket_connect(f"/server/ws/?token={bob_token}") as bob_ws:
            bob_ws.receive_json()  # bob's user_list

            # alice should receive user_joined for bob
            msg = alice_ws.receive_json()
            assert msg["type"] == "user_joined"
            assert msg["user_id"] == "bob"
            assert msg["email"] == "bob@test.com"
