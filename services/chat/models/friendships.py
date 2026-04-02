from sqlalchemy import DateTime, String, text, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base
from datetime import datetime


class Friendships(Base):
    __tablename__ = "friendships"
    __table_args__ = (
        CheckConstraint("user_id!=friend_id"), 
    )
    user_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    friend_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()")
    )