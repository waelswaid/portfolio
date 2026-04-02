from sqlalchemy import DateTime, String, text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"


    id: Mapped[str] = mapped_column(
        String,
        primary_key=True
    )

    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()")
    )
