import os
import time
import asyncio
import jwt as pyjwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# ── generate RSA key pair and set env vars BEFORE any app imports ──

_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

PRIVATE_KEY_PEM = _private_key.private_bytes(
    serialization.Encoding.PEM,
    serialization.PrivateFormat.PKCS8,
    serialization.NoEncryption(),
)

PUBLIC_KEY_PEM = _private_key.public_key().public_bytes(
    serialization.Encoding.PEM,
    serialization.PublicFormat.SubjectPublicKeyInfo,
).decode()

PG_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "postgres")

os.environ["CHAT_DATABASE_URL"] = f"postgresql://postgres:{PG_PASSWORD}@localhost:5432/chat_test"
os.environ["JWT_PUBLIC_KEY"] = PUBLIC_KEY_PEM
os.environ["KAFKA_BOOTSTRAP_SERVERS"] = "localhost:9092"
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = ""

# ── now safe to import app code ──

import pytest
from starlette.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text
from models.base import Base
from models.users import User
from models.chats import Chat
from models.chat_members import ChatMember
from models.messages import Message
from models.pending_requests import PendingRequests
from models.friendships import Friendships
from main import app

TEST_DB_URL = f"postgresql+asyncpg://postgres:{PG_PASSWORD}@localhost:5432/chat_test"
ALL_TABLES = ["messages", "chat_members", "chats", "friendships", "pending_requests", "users"]

# explicit event loop for the test thread (Python 3.14 compatible)
_loop = asyncio.new_event_loop()


def run_async(coro):
    """Run an async coroutine on the test thread's event loop."""
    return _loop.run_until_complete(coro)


# ── session-scoped test client (starts Kafka producer/consumer once) ──

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


# ── token factory ──

@pytest.fixture(scope="session")
def make_token():
    def _make(user_id: str, email: str) -> str:
        return pyjwt.encode(
            {"sub": user_id, "email": email},
            PRIVATE_KEY_PEM,
            algorithm="RS256",
        )
    return _make


# ── DB session factory for test-side verification ──

@pytest.fixture(scope="session")
def test_session_factory():
    eng = create_async_engine(TEST_DB_URL, echo=False)

    async def _setup():
        async with eng.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    run_async(_setup())
    factory = async_sessionmaker(eng, expire_on_commit=False)
    yield factory
    run_async(eng.dispose())


# ── cleanup between tests ──

@pytest.fixture(autouse=True)
def cleanup_db(test_session_factory):
    yield

    async def _truncate():
        async with test_session_factory() as session:
            await session.execute(text(f"TRUNCATE {', '.join(ALL_TABLES)} CASCADE"))
            await session.commit()

    run_async(_truncate())


@pytest.fixture(autouse=True)
def cleanup_manager():
    yield
    # let the app thread finish processing any pending disconnects
    time.sleep(0.1)
    from connection_manager import manager
    manager.cancel_all_pending()
    manager.active_connections.clear()
    manager.pending_disconnects.clear()


# ── helper: poll DB for async Kafka persistence ──

async def poll_db(session_factory, query_fn, timeout=5.0, interval=0.3):
    """Poll DB until query_fn(session) returns truthy, or raise TimeoutError."""
    elapsed = 0
    while elapsed < timeout:
        async with session_factory() as session:
            result = await query_fn(session)
            if result:
                return result
        await asyncio.sleep(interval)
        elapsed += interval
    raise TimeoutError("DB condition not met within timeout")
