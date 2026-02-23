"""Goals API: get and upsert calorie/nutrient goals per user."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.goal import Goal
from app.schemas.goal import GoalUpdate, GoalResponse

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("/", response_model=GoalResponse)
async def get_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's calorie and nutrient goals."""
    result = await db.execute(select(Goal).where(Goal.user_id == current_user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No goals set")
    return GoalResponse.model_validate(goal)


@router.put("/", response_model=GoalResponse)
async def upsert_goals(
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update the user's goals."""
    result = await db.execute(select(Goal).where(Goal.user_id == current_user.id))
    goal = result.scalar_one_or_none()

    if not goal:
        goal = Goal(user_id=current_user.id)
        db.add(goal)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    # Mark as custom so auto-calculation never overwrites it
    goal.is_custom = True

    await db.commit()
    await db.refresh(goal)
    return GoalResponse.model_validate(goal)
