from sqlalchemy import DateTime, String, BigInteger, Index, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base
from datetime import datetime


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_chat_id_message_id", "chat_id", "message_id"),
    )

    message_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )
    chat_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("chats.chat_id", ondelete="CASCADE"),
        nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    message: Mapped[str] = mapped_column(
        String,
        nullable=False
    )
    type: Mapped[str] = mapped_column(
        String,
        nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()")
    )
