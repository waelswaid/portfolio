from pydantic import BaseModel, ConfigDict

class WSMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")


# client -> server

"""
desc: send a friend request
reject: target is self, already friends, pending request already exists (in either direction)
DB operation: INSERT into pending_requests
payload: {to: user_id}
"""
class FriendRequest(WSMessage):
    to:str


"""
desc: accept a pending request
reject: no matching pending request exists
DB operation (single transaction): DELETE from pending_requests + INSERT two rows into friendships
payload: {from:user_id}
"""
class FriendAccept(WSMessage):
    from_user:str


"""
desc: decline a pending request
reject: no matching pending request exists
DB operation: DELETE from pending_requests
payload: {from:user_id}
"""
class FriendDecline(WSMessage):
    from_user:str


"""
desc: unfriend
reject: not currently friends
DB operation: DELETE both rows from friendships
payload: {user_id:user_id}
"""
class FriendRemove(WSMessage):
    user_id:str


