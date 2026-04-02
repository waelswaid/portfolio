from sqlalchemy import DateTime, String, text, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base
from datetime import datetime



class PendingRequests(Base):
    __tablename__ = "pending_requests"
    __table_args__ = (
        CheckConstraint("sender_id!=receiver_id"),
    )
    sender_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    receiver_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()")
    )