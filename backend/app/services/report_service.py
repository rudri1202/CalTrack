"""Report aggregates: weekly calories, macros, micros, goal comparison."""
import uuid
from datetime import date
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.food_entry import FoodEntry
from app.models.goal import Goal


async def get_weekly_calories(
    db: AsyncSession, user_id: uuid.UUID, start_date: date, end_date: date
) -> dict:
    """Daily calorie totals for the date range."""
    result = await db.execute(
        select(
            FoodEntry.logged_at,
            func.sum(FoodEntry.calories).label("calories"),
            func.count(FoodEntry.id).label("entry_count"),
        )
        .where(
            and_(
                FoodEntry.user_id == user_id,
                FoodEntry.logged_at >= start_date,
                FoodEntry.logged_at <= end_date,
            )
        )
        .group_by(FoodEntry.logged_at)
        .order_by(FoodEntry.logged_at)
    )
    rows = result.all()

    data = [
        {"date": row.logged_at, "calories": row.calories or 0.0, "entry_count": row.entry_count}
        for row in rows
    ]
    avg_calories = sum(d["calories"] for d in data) / len(data) if data else 0.0

    return {
        "data": data,
        "start_date": start_date,
        "end_date": end_date,
        "average_daily_calories": round(avg_calories, 2),
    }


async def get_macro_breakdown(
    db: AsyncSession, user_id: uuid.UUID, start_date: date, end_date: date
) -> dict:
    """Daily protein/carbs/fat totals for the date range."""
    result = await db.execute(
        select(
            FoodEntry.logged_at,
            func.sum(FoodEntry.protein_g).label("protein_g"),
            func.sum(FoodEntry.carbs_g).label("carbs_g"),
            func.sum(FoodEntry.fat_g).label("fat_g"),
            func.sum(FoodEntry.calories).label("calories"),
        )
        .where(
            and_(
                FoodEntry.user_id == user_id,
                FoodEntry.logged_at >= start_date,
                FoodEntry.logged_at <= end_date,
            )
        )
        .group_by(FoodEntry.logged_at)
        .order_by(FoodEntry.logged_at)
    )
    rows = result.all()

    data = [
        {
            "date": row.logged_at,
            "protein_g": round(row.protein_g or 0.0, 2),
            "carbs_g": round(row.carbs_g or 0.0, 2),
            "fat_g": round(row.fat_g or 0.0, 2),
            "calories": round(row.calories or 0.0, 2),
        }
        for row in rows
    ]
    totals = {
        "protein_g": round(sum(d["protein_g"] for d in data), 2),
        "carbs_g": round(sum(d["carbs_g"] for d in data), 2),
        "fat_g": round(sum(d["fat_g"] for d in data), 2),
    }

    return {"data": data, "start_date": start_date, "end_date": end_date, "totals": totals}


async def get_micro_summary(
    db: AsyncSession, user_id: uuid.UUID, start_date: date, end_date: date
) -> dict:
    """Fiber, sugar, sodium and micronutrient aggregates for the date range."""
    where_clause = and_(
        FoodEntry.user_id == user_id,
        FoodEntry.logged_at >= start_date,
        FoodEntry.logged_at <= end_date,
    )

    # Aggregate scalar micro columns
    sums_result = await db.execute(
        select(
            func.coalesce(func.sum(FoodEntry.fiber_g), 0.0).label("fiber_g"),
            func.coalesce(func.sum(FoodEntry.sugar_g), 0.0).label("sugar_g"),
            func.coalesce(func.sum(FoodEntry.sodium_mg), 0.0).label("sodium_mg"),
        ).where(where_clause)
    )
    sums = sums_result.one()

    # Fetch JSONB micronutrient blobs for manual aggregation
    micros_result = await db.execute(
        select(FoodEntry.micronutrients)
        .where(where_clause)
        .where(FoodEntry.micronutrients.isnot(None))
    )
    aggregated_micros: dict = defaultdict(float)
    for (micros,) in micros_result.all():
        if micros:
            for key, val in micros.items():
                try:
                    aggregated_micros[key] += float(val)
                except (TypeError, ValueError):
                    pass

    total_fiber = float(sums.fiber_g)
    total_sugar = float(sums.sugar_g)
    total_sodium = float(sums.sodium_mg)

    return {
        "start_date": start_date,
        "end_date": end_date,
        "fiber_g": round(total_fiber, 2),
        "sugar_g": round(total_sugar, 2),
        "sodium_mg": round(total_sodium, 2),
        "micronutrients": {k: round(v, 2) for k, v in aggregated_micros.items()},
    }


async def get_goal_comparison(
    db: AsyncSession, user_id: uuid.UUID, start_date: date, end_date: date
) -> dict:
    """Compare daily actual intake vs goals for each day in the range."""
    # Get user's goal
    goal_result = await db.execute(select(Goal).where(Goal.user_id == user_id))
    goal = goal_result.scalar_one_or_none()

    goal_data = {
        "daily_calories": goal.daily_calories if goal else 2000,
        "protein_g": goal.protein_g if goal else 150.0,
        "carbs_g": goal.carbs_g if goal else 250.0,
        "fat_g": goal.fat_g if goal else 65.0,
    }

    # Get daily actuals
    result = await db.execute(
        select(
            FoodEntry.logged_at,
            func.sum(FoodEntry.calories).label("calories"),
            func.sum(FoodEntry.protein_g).label("protein_g"),
            func.sum(FoodEntry.carbs_g).label("carbs_g"),
            func.sum(FoodEntry.fat_g).label("fat_g"),
        )
        .where(
            and_(
                FoodEntry.user_id == user_id,
                FoodEntry.logged_at >= start_date,
                FoodEntry.logged_at <= end_date,
            )
        )
        .group_by(FoodEntry.logged_at)
        .order_by(FoodEntry.logged_at)
    )
    rows = result.all()

    data = [
        {
            "date": row.logged_at,
            "goal_calories": goal_data["daily_calories"],
            "actual_calories": round(row.calories or 0.0, 2),
            "goal_protein_g": goal_data["protein_g"],
            "actual_protein_g": round(row.protein_g or 0.0, 2),
            "goal_carbs_g": goal_data["carbs_g"],
            "actual_carbs_g": round(row.carbs_g or 0.0, 2),
            "goal_fat_g": goal_data["fat_g"],
            "actual_fat_g": round(row.fat_g or 0.0, 2),
        }
        for row in rows
    ]

    return {
        "data": data,
        "start_date": start_date,
        "end_date": end_date,
        "goal": goal_data,
    }
