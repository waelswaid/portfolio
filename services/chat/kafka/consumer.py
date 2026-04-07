import asyncio
import json
import logging
from aiokafka import AIOKafkaConsumer
from opentelemetry import trace, context
from core.config import settings
from schemas.chat_event import ChatMessageEvent
from services.chat_service import persist_message
from shared.tracing import extract_trace_context
from shared.metrics import kafka_messages_consumed, kafka_consumer_errors

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

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
                            token = None
                            extract_exc = None
                            try:
                                ctx = extract_trace_context(msg.headers)
                                token = context.attach(ctx)
                            except Exception as exc:
                                extract_exc = exc
                                logger.warning("trace context extraction failed", exc_info=True)
                            try:
                                with tracer.start_as_current_span("kafka.consume chat-messages", kind=trace.SpanKind.CONSUMER) as span:
                                    if extract_exc is not None:
                                        span.record_exception(extract_exc)
                                    span.set_attribute("messaging.system", "kafka")
                                    span.set_attribute("messaging.destination", "chat-messages")
                                    success = await self._handle_message(msg.value)
                                    if not success:
                                        span.set_status(trace.StatusCode.ERROR, "max retries exhausted")
                                kafka_messages_consumed.add(1)
                            finally:
                                if token is not None:
                                    context.detach(token)
                        await self._consumer.commit()
                finally:
                    await self._consumer.stop()
            except asyncio.CancelledError:
                return
            except Exception:
                logger.exception("Kafka consumer loop crashed, restarting in 5s")
                await asyncio.sleep(5)

    async def _handle_message(self, payload: dict) -> bool:
        event = ChatMessageEvent(**payload)
        for attempt in range(MAX_RETRIES):
            try:
                await persist_message(
                    event.msg_type, event.message,
                    event.sender_id, event.chat_id,
                )
                return True
            except Exception:
                logger.warning(
                    "consume handler failed (attempt %d/%d)", attempt + 1, MAX_RETRIES, exc_info=True
                )
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAYS[attempt])

        kafka_consumer_errors.add(1)
        logger.error("Max retries exhausted, message dropped: %s", payload)
        return False


consumer = ChatConsumer()
