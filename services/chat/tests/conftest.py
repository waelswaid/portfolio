import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text
from models.base import Base

# import all models so Base.metadata knows about them
from models.users import User
from models.chats import Chat
from models.chat_members import ChatMember
from models.messages import Message
from models.pending_requests import PendingRequests
from models.friendships import Friendships

TEST_DB_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/chat_test"

ALL_TABLES = ["messages", "chat_members", "chats", "friendships", "pending_requests", "users"]


@pytest.fixture
async def engine():
    eng = create_async_engine(TEST_DB_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.execute(text(f"TRUNCATE {', '.join(ALL_TABLES)} CASCADE"))
    await eng.dispose()


@pytest.fixture
def session_factory(engine):
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
def create_user(session_factory):
    async def _create(user_id: str, email: str) -> User:
        async with session_factory() as session:
            user = User(id=user_id, email=email)
            session.add(user)
            await session.commit()
            return user
    return _create
