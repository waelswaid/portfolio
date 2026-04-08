import os
import time
import jwt as pyjwt
import psycopg2
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

PG_HOST = os.environ.get("PG_HOST", "localhost")
PG_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "postgres")
KAFKA_HOST = os.environ.get("KAFKA_HOST", "localhost")

os.environ["CHAT_DATABASE_URL"] = f"postgresql://postgres:{PG_PASSWORD}@{PG_HOST}:5432/chat_test"
os.environ["JWT_PUBLIC_KEY"] = PUBLIC_KEY_PEM
os.environ["KAFKA_BOOTSTRAP_SERVERS"] = f"{KAFKA_HOST}:9092"
os.environ["KAFKA_TOPIC"] = "chat-messages-test"
os.environ["KAFKA_CONSUMER_GROUP"] = "chat-test-consumers"
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = ""

# ── now safe to import app code ──

import pytest
from starlette.testclient import TestClient
from main import app

PG_DSN = f"host={PG_HOST} port=5432 dbname=chat_test user=postgres password={PG_PASSWORD}"
ALL_TABLES = ["messages", "chat_members", "chats", "friendships", "pending_requests", "users"]


def query_db(sql, params=None):
    """Run a synchronous SQL query and return all rows."""
    conn = psycopg2.connect(PG_DSN)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        conn.close()


def query_scalar(sql, params=None):
    """Run a synchronous SQL query and return a single value."""
    rows = query_db(sql, params)
    return rows[0][0] if rows else None


def poll_db_sync(check_fn, timeout=15.0, interval=0.5):
    """Poll DB until check_fn() returns truthy, or raise TimeoutError."""
    elapsed = 0
    while elapsed < timeout:
        result = check_fn()
        if result:
            return result
        time.sleep(interval)
        elapsed += interval
    raise TimeoutError("DB condition not met within timeout")


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


# ── cleanup between tests ──

@pytest.fixture(autouse=True)
def cleanup_db():
    yield
    conn = psycopg2.connect(PG_DSN)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(f"TRUNCATE {', '.join(ALL_TABLES)} CASCADE")
    finally:
        conn.close()


@pytest.fixture(autouse=True)
def cleanup_manager():
    yield
    # let the app thread finish processing any pending disconnects
    time.sleep(0.1)
    from connection_manager import manager
    manager.cancel_all_pending()
    manager.active_connections.clear()
    manager.pending_disconnects.clear()
