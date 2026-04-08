import json
import logging
import os
from aiokafka import AIOKafkaProducer
from opentelemetry import trace
from core.config import settings
from schemas.chat_event import ChatMessageEvent
from shared.tracing import inject_trace_context
from shared.metrics import kafka_messages_produced

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class ChatProducer:
    def __init__(self, topic="chat-messages"):
        self._topic = topic
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
        with tracer.start_as_current_span(f"kafka.produce {self._topic}", kind=trace.SpanKind.PRODUCER) as span:
            span.set_attribute("messaging.system", "kafka")
            span.set_attribute("messaging.destination", self._topic)
            headers = []
            try:
                headers = inject_trace_context()
            except Exception as exc:
                logger.warning("trace context injection failed", exc_info=True)
                span.record_exception(exc)
            await self._producer.send_and_wait(self._topic, value=event.model_dump(), key=chat_id, headers=headers)
        kafka_messages_produced.add(1)

# async producer singleton
producer = ChatProducer(topic=os.environ.get("KAFKA_TOPIC", "chat-messages"))
