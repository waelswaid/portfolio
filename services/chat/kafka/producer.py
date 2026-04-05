import json
import logging
from aiokafka import AIOKafkaProducer
from core.config import settings
from schemas.chat_event import ChatMessageEvent

logger = logging.getLogger(__name__)


class ChatProducer:
    def __init__(self):
        self._producer: AIOKafkaProducer | None = None

    async def start(self):
        self._producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode(),
            key_serializer=lambda k: k.encode(),
        )
        await self._producer.start()
        logger.info("Kafka producer started")

    async def stop(self):
        if self._producer:
            await self._producer.stop()
            logger.info("Kafka producer stopped")

    async def produce(self, msg_type: str, message: str, sender_id: str, receiver_id: str, chat_id: str):
        if self._producer is None:
            raise RuntimeError("Kafka producer not started")
        event = ChatMessageEvent(
            msg_type=msg_type, message=message,
            sender_id=sender_id, receiver_id=receiver_id, chat_id=chat_id,
        )
        await self._producer.send_and_wait("chat-messages", value=event.model_dump(), key=chat_id)

# async producer singleton
producer = ChatProducer()
