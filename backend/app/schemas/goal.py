import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator


class GoalBase(BaseModel):
    daily_calories: int = 2000
    protein_g: float = 150.0
    carbs_g: float = 250.0
    fat_g: float = 65.0
    weight_goal_kg: float | None = None

    @field_validator("daily_calories")
    @classmethod
    def validate_calories(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Daily calories must be positive")
        return v

    @field_validator("protein_g", "carbs_g", "fat_g")
    @classmethod
    def validate_macros(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Macro values cannot be negative")
        return v


class GoalCreate(GoalBase):
    pass


class GoalUpdate(GoalBase):
    daily_calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None


class GoalResponse(GoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
