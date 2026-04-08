import logging
from models.notifications import Notification
from repository.notification_repo import (
    insert_notification, get_unread_notifications, mark_notifications_read
)
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, session_factory):
        self._session_factory = session_factory

    async def create(self, user_id: str, notification_type: str, payload: dict) -> int:
        async with self._session_factory() as session:
            try:
                notification = Notification(
                    user_id=user_id, type=notification_type, payload=payload
                )
                await insert_notification(session, notification)
                await session.flush()
                nid = notification.id
                await session.commit()
                return nid
            except SQLAlchemyError as e:
                logger.error("create notification failed: %s", e)
                await session.rollback()
                raise

    async def get_unread(self, user_id: str) -> list[dict]:
        async with self._session_factory() as session:
            notifications = await get_unread_notifications(session, user_id)
            return [
                {
                    "id": n.id,
                    "type": n.type,
                    "payload": n.payload,
                    "created_at": n.created_at.isoformat(),
                }
                for n in notifications
            ]

    async def mark_read(self, user_id: str, notification_ids: list[int]) -> int:
        async with self._session_factory() as session:
            try:
                count = await mark_notifications_read(session, user_id, notification_ids)
                await session.commit()
                return count
            except SQLAlchemyError as e:
                logger.error("mark_read failed: %s", e)
                await session.rollback()
                raise
