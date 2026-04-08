from sqlalchemy import select, update
from models.notifications import Notification


async def insert_notification(session, notification: Notification) -> None:
    session.add(notification)


async def get_unread_notifications(session, user_id: str) -> list[Notification]:
    result = await session.execute(
        select(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .order_by(Notification.created_at, Notification.id)
        .limit(100)
    )
    return list(result.scalars().all())


async def mark_notifications_read(session, user_id: str, notification_ids: list[int]) -> int:
    result = await session.execute(
        update(Notification)
        .where(Notification.id.in_(notification_ids), Notification.user_id == user_id)
        .values(is_read=True)
    )
    return result.rowcount
