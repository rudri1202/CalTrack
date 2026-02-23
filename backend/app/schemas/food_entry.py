import uuid
from datetime import datetime, date
from pydantic import BaseModel, field_validator
from app.models.food_entry import MealType


class FoodEntryBase(BaseModel):
    meal_type: MealType
    food_name: str
    quantity: float = 1.0
    quantity_unit: str = "serving"
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    fiber_g: float | None = None
    sugar_g: float | None = None
    sodium_mg: float | None = None
    micronutrients: dict | None = None
    logged_at: date

    @field_validator("food_name")
    @classmethod
    def validate_food_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Food name cannot be empty")
        return v

    @field_validator("calories", "protein_g", "carbs_g", "fat_g")
    @classmethod
    def validate_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Nutritional values cannot be negative")
        return v


class FoodEntryCreate(FoodEntryBase):
    pass


class FoodEntryUpdate(BaseModel):
    meal_type: MealType | None = None
    food_name: str | None = None
    quantity: float | None = None
    quantity_unit: str | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fiber_g: float | None = None
    sugar_g: float | None = None
    sodium_mg: float | None = None
    micronutrients: dict | None = None
    logged_at: date | None = None


class FoodEntryResponse(FoodEntryBase):
    id: uuid.UUID
    user_id: uuid.UUID
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedFoodEntries(BaseModel):
    items: list[FoodEntryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
