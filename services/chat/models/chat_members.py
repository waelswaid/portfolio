from sqlalchemy import DateTime, String, Boolean, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base
from datetime import datetime


class ChatMember(Base):
    __tablename__ = "chat_members"

    chat_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("chats.chat_id", ondelete="CASCADE"),
        primary_key=True
    )
    user_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()")
    )
