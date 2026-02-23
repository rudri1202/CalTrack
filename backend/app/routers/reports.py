"""Reports API: weekly calories, macros, micros, goal comparison."""
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.report import WeeklyCaloriesResponse, MacroBreakdownResponse, MicroSummaryResponse, GoalComparisonResponse
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/weekly-calories", response_model=WeeklyCaloriesResponse)
async def weekly_calories(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calories per day for the given date range."""
    result = await report_service.get_weekly_calories(db, current_user.id, start_date, end_date)
    return WeeklyCaloriesResponse(**result)


@router.get("/macro-breakdown", response_model=MacroBreakdownResponse)
async def macro_breakdown(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Protein, carbs, fat totals for the date range."""
    result = await report_service.get_macro_breakdown(db, current_user.id, start_date, end_date)
    return MacroBreakdownResponse(**result)


@router.get("/micro-summary", response_model=MicroSummaryResponse)
async def micro_summary(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Vitamins and minerals summary for the date range."""
    result = await report_service.get_micro_summary(db, current_user.id, start_date, end_date)
    return MicroSummaryResponse(**result)


@router.get("/goal-comparison", response_model=GoalComparisonResponse)
async def goal_comparison(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compare actual intake vs goals for the date range."""
    result = await report_service.get_goal_comparison(db, current_user.id, start_date, end_date)
    return GoalComparisonResponse(**result)
