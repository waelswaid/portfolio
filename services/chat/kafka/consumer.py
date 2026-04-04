import asyncio
import json
import logging
from aiokafka import AIOKafkaConsumer
from core.config import settings
from database import async_session
from models.messages import Message
from repository.chat_repo import insert_message
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]


class ChatConsumer:
    def __init__(self):
        self._task: asyncio.Task | None = None
        self._consumer: AIOKafkaConsumer | None = None

    def start(self):
        self._task = asyncio.create_task(self._consume_loop())
        logger.info("Kafka consumer started")

    def stop(self):
        if self._task:
            self._task.cancel()
            logger.info("Kafka consumer stopped")

    async def _consume_loop(self):
        while True:
            try:
                self._consumer = AIOKafkaConsumer(
                    "chat-messages",
                    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                    group_id="chat-consumers",
                    auto_offset_reset="earliest",
                    enable_auto_commit=False,
                    value_deserializer=lambda v: json.loads(v.decode()),
                )
                await self._consumer.start()
                try:
                    async for msg in self._consumer:
                        if msg.value is not None:
                            await self._handle_message(msg.value)
                        await self._consumer.commit()
                finally:
                    await self._consumer.stop()
            except asyncio.CancelledError:
                return
            except Exception:
                logger.exception("Kafka consumer loop crashed, restarting in 5s")
                await asyncio.sleep(5)

    async def _handle_message(self, payload: dict):
        for attempt in range(MAX_RETRIES):
            try:
                async with async_session() as session:
                    message_orm = Message(
                        chat_id=payload["chat_id"],
                        user_id=payload["sender_id"],
                        message=payload["message"],
                        type=payload["msg_type"],
                    )
                    await insert_message(session, message_orm)
                    await session.commit()
                return
            except SQLAlchemyError:
                logger.warning(
                    "DB insert failed (attempt %d/%d)", attempt + 1, MAX_RETRIES, exc_info=True
                )
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAYS[attempt])

        logger.error("Max retries exhausted, message dropped: %s", payload)


consumer = ChatConsumer()
