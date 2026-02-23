"""Pure nutrition calculation utilities: BMR, TDEE, and macro targets.

Uses Mifflin-St Jeor formula with a moderate activity multiplier (1.55).
No side effects — safe to call from any context.
"""
from typing import Literal

Gender = Literal['male', 'female']
GoalType = Literal['bulking', 'cutting', 'maintenance']

_ACTIVITY_MULTIPLIER = 1.55  # Moderate activity: 3–5 days/week


def calculate_goals(
    height_cm: float,
    weight_kg: float,
    age: int,
    gender: Gender,
    goal_type: GoalType,
) -> dict[str, int | float]:
    """Calculate daily calorie and macro targets.

    Returns a dict with: daily_calories (int), protein_g, carbs_g, fat_g (float).
    """
    # Mifflin-St Jeor BMR
    if gender == 'male':
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    tdee = bmr * _ACTIVITY_MULTIPLIER

    # Calorie target by goal
    if goal_type == 'bulking':
        calories = tdee + 300
    elif goal_type == 'cutting':
        calories = tdee - 500
    else:
        calories = tdee

    calories = max(1200, round(calories))  # Safety floor at 1200 kcal

    # Macros
    # Protein: 2.0 g/kg for body-composition goals, 1.6 g/kg for maintenance
    protein_g = round(2.0 * weight_kg if goal_type != 'maintenance' else 1.6 * weight_kg, 1)
    fat_g = round((calories * 0.25) / 9, 1)          # 25% of calories from fat
    carb_cals = calories - protein_g * 4 - fat_g * 9
    carbs_g = round(max(0.0, carb_cals) / 4, 1)

    return {
        'daily_calories': calories,
        'protein_g': protein_g,
        'carbs_g': carbs_g,
        'fat_g': fat_g,
    }
