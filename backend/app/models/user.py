"""User model: account, profile, and relationships."""
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    """User account: email, hashed password, name, optional body/goal profile, timestamps."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Optional profile fields used for auto goal calculation
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)    # 'male' | 'female'
    goal_type: Mapped[str | None] = mapped_column(String(20), nullable=True)  # 'bulking' | 'cutting' | 'maintenance'

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    goal: Mapped["Goal"] = relationship("Goal", back_populates="user", uselist=False, cascade="all, delete-orphan")
    food_entries: Mapped[list["FoodEntry"]] = relationship("FoodEntry", back_populates="user", cascade="all, delete-orphan")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
