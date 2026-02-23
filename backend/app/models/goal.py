"""Goal model: daily calorie and macro targets per user."""
import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, Integer, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Goal(Base):
    """Daily calorie and nutrient goals; one per user."""

    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    daily_calories: Mapped[int] = mapped_column(Integer, nullable=False, default=2000)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False, default=150.0)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False, default=250.0)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False, default=65.0)
    weight_goal_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="goal")
