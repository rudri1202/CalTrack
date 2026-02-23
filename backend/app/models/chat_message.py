"""ChatMessage model: AI assistant conversation history."""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import ForeignKey, Text, DateTime, func, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class MessageRole(str, PyEnum):
    """Chat message sender: user or assistant."""

    user = "user"
    assistant = "assistant"


class ChatMessage(Base):
    """Single message in the nutrition assistant chat."""

    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    user: Mapped["User"] = relationship("User", back_populates="chat_messages")
