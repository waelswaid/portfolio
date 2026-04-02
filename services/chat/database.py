from sqlalchemy.ext.asyncio import create_async_engine
from core.config import settings
from sqlalchemy.ext.asyncio import async_sessionmaker




# This is your connection pool. One instance, shared across the app. It reads the DB URL from your config
engine = create_async_engine(settings.CHAT_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))

"""
  A session is a short-lived object that you use to run queries — think of it as a conversation with the database. You open one, do your 
  reads/writes, commit, and close it.

  async_sessionmaker doesn't create a session — it creates a factory that produces sessions. Every time you need to talk to the DB, you  
  do:

  async with async_session() as session:
      # run queries here

  The async with ensures the session is properly closed when you're done.
"""

async_session = async_sessionmaker(engine, expire_on_commit=False)


# in any REST route you can use db: AsyncSession = Depends(get_db). For WebSocket handlers you'll call async_session()
async def get_db():
    async with async_session() as session:
        yield session