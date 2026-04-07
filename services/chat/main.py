from fastapi import FastAPI
from routes.chat_websocket import websocket_router
from contextlib import asynccontextmanager
from database import engine, async_session
from connection_manager import manager
from kafka.producer import producer
from kafka.consumer import ChatConsumer
from shared.observability import init_observability, shutdown_observability
from shared.health import check_postgres, check_kafka, build_health_response
from core.config import settings
from services.chat_service import ChatService
import dispatch.handlers.chat_handlers  # noqa: F401 — register handlers
import dispatch.handlers.friend_handlers  # noqa: F401 — register handlers

init_observability("chat", engine=engine)

chat_service = ChatService(async_session)
consumer = ChatConsumer(persist_message=chat_service.persist_message)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.chat_service = chat_service
    app.state.producer = producer
    app.state.manager = manager
    await producer.start()
    consumer.start()
    yield
    # cancel all grace period timers before shutting down
    manager.cancel_all_pending()
    consumer.stop()
    await producer.stop()
    await engine.dispose()
    shutdown_observability()


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    checks = {}
    checks.update(await check_postgres(engine))
    checks.update(await check_kafka(settings.KAFKA_BOOTSTRAP_SERVERS))
    return build_health_response(checks)


app.include_router(websocket_router, prefix="/server")


