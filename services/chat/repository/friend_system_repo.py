from models.friendships import Friendships
from models.pending_requests import PendingRequests
from database import async_session
from sqlalchemy import delete, or_, and_, select

async def send_friend_req_to_db(session, to:str, user_id: str) -> None:
    request = PendingRequests(
        sender_id = user_id,
        receiver_id = to
    )
    session.add(request)
    return

# delete from PendingRequests, insert into Friendships (single transaction)
async def friend_request_accept_to_db(session, requester_id:str, accepter_id:str) -> None:
    result = await session.execute(
        delete(PendingRequests).where(
            PendingRequests.sender_id == requester_id,
            PendingRequests.receiver_id == accepter_id
        )
    )
    if result.rowcount == 0:
        raise ValueError("no pending request found")
    
    session.add_all([
        Friendships(user_id=accepter_id, friend_id=requester_id),
        Friendships(user_id = requester_id, friend_id=accepter_id)
    ])
    return
        

async def friend_req_decline_to_db(session, requester_id: str, decliner_id:str) -> None:
    result = await session.execute(
        delete(PendingRequests).where(
            PendingRequests.sender_id == requester_id,
            PendingRequests.receiver_id == decliner_id
        )
    )
    if result.rowcount == 0:
        raise ValueError("no pending request found")
    return

async def friend_remove_from_db(session, removed_id: str, remover_id:str) -> None:
    result = await session.execute(
        delete(Friendships).where(
            or_(
                and_(Friendships.user_id == remover_id, Friendships.friend_id == removed_id),
                and_(Friendships.user_id == removed_id, Friendships.friend_id == remover_id)
            )

        )
    )
    if result.rowcount == 0:
        raise ValueError("not friends")
    return

# TODO only returns user_id, it should return email aswell
async def get_friend_list_from_db(session, user_id: str) -> list[dict]:
    result = await session.execute(
        select(Friendships.friend_id).where(Friendships.user_id == user_id)
    )
    return [{"user_id": row.friend_id} for row in result.all()]

# TODO only returns user_id, it should return email aswell
async def get_pending_list_from_db(session, user_id: str) -> dict:
    sent = await session.execute(
        select(PendingRequests.receiver_id).where(PendingRequests.sender_id == user_id)
    )
    received = await session.execute(
        select(PendingRequests.sender_id).where(PendingRequests.receiver_id == user_id)
    )
    return {
        "sent": [{"user_id": row.receiver_id} for row in sent.all()],
        "received": [{"user_id": row.sender_id} for row in received.all()]
    }