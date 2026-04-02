from sqlalchemy.dialects.postgresql import insert
from models.users import User

# upsert = update + insert
async def upsert_user(session, user_id: str, email:str):
    # insert a user
    stmt = insert(User).values(id=user_id, email=email)
    # if user exists update email
    stmt = stmt.on_conflict_do_update(
        index_elements=["id"],
        set_={"email":email}
    )
    await session.execute(stmt)
    await session.commit()