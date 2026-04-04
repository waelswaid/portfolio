from fastapi import FastAPI
from routes.chat_websocket import websocket_router
from contextlib import asynccontextmanager
from database import engine
from connection_manager import manager
from kafka.producer import producer
from kafka.consumer import consumer




@asynccontextmanager
async def lifespan(app: FastAPI):
    await producer.start()
    consumer.start()
    yield
    # cancel all grace period timers before shutting down
    manager.cancel_all_pending()
    consumer.stop()
    await producer.stop()
    await engine.dispose()


app = FastAPI(lifespan = lifespan)



@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(websocket_router, prefix="/server")


