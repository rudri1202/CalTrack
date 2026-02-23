from datetime import date
from pydantic import BaseModel


class DailyCalories(BaseModel):
    date: date
    calories: float
    entry_count: int


class WeeklyCaloriesResponse(BaseModel):
    data: list[DailyCalories]
    start_date: date
    end_date: date
    average_daily_calories: float


class DailyMacros(BaseModel):
    date: date
    protein_g: float
    carbs_g: float
    fat_g: float
    calories: float


class MacroBreakdownResponse(BaseModel):
    data: list[DailyMacros]
    start_date: date
    end_date: date
    totals: dict  # {"protein_g": x, "carbs_g": y, "fat_g": z}


class MicroSummaryResponse(BaseModel):
    start_date: date
    end_date: date
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    micronutrients: dict  # Aggregated from JSONB


class GoalActual(BaseModel):
    date: date
    goal_calories: float
    actual_calories: float
    goal_protein_g: float
    actual_protein_g: float
    goal_carbs_g: float
    actual_carbs_g: float
    goal_fat_g: float
    actual_fat_g: float


class GoalComparisonResponse(BaseModel):
    data: list[GoalActual]
    start_date: date
    end_date: date
    goal: dict
