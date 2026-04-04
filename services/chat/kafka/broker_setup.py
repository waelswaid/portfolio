import asyncio
import logging
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from aiokafka.errors import TopicAlreadyExistsError
from core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TOPICS = [
    NewTopic(name="chat-messages", num_partitions=3, replication_factor=1),
]


async def create_topics():
    admin = AIOKafkaAdminClient(bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS)
    await admin.start()
    try:
        for topic in TOPICS:
            try:
                await admin.create_topics([topic])
                logger.info("created topic: %s", topic.name)
            except TopicAlreadyExistsError:
                logger.info("topic already exists: %s", topic.name)
    finally:
        await admin.close()


if __name__ == "__main__":
    asyncio.run(create_topics())
