"""Food entry CRUD and listing with date/meal filters."""
import uuid
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from fastapi import HTTPException, status
from app.models.food_entry import FoodEntry, MealType
from app.schemas.food_entry import FoodEntryCreate, FoodEntryUpdate
from app.utils.pagination import get_offset, paginate


async def create_entry(db: AsyncSession, user_id: uuid.UUID, data: FoodEntryCreate) -> FoodEntry:
    """Create a new food entry for the user."""
    entry = FoodEntry(user_id=user_id, **data.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_entries(
    db: AsyncSession,
    user_id: uuid.UUID,
    start_date: date,
    end_date: date,
    meal_type: MealType | None,
    page: int,
    page_size: int,
) -> dict:
    """List entries for date range with optional meal filter and pagination."""
    filters = [
        FoodEntry.user_id == user_id,
        FoodEntry.logged_at >= start_date,
        FoodEntry.logged_at <= end_date,
    ]
    if meal_type:
        filters.append(FoodEntry.meal_type == meal_type)

    count_result = await db.execute(
        select(func.count()).select_from(FoodEntry).where(and_(*filters))
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(FoodEntry)
        .where(and_(*filters))
        .order_by(FoodEntry.logged_at.desc(), FoodEntry.created_at.desc())
        .offset(get_offset(page, page_size))
        .limit(page_size)
    )
    items = result.scalars().all()

    return {"items": items, **paginate(total, page, page_size)}


async def get_entry_by_id(db: AsyncSession, entry_id: uuid.UUID, user_id: uuid.UUID) -> FoodEntry:
    """Fetch one entry by ID; 404 if not found or not owned by user."""
    result = await db.execute(
        select(FoodEntry).where(FoodEntry.id == entry_id, FoodEntry.user_id == user_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry


async def update_entry(
    db: AsyncSession, entry_id: uuid.UUID, user_id: uuid.UUID, data: FoodEntryUpdate
) -> FoodEntry:
    """Update an entry with partial data."""
    entry = await get_entry_by_id(db, entry_id, user_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_entry(db: AsyncSession, entry_id: uuid.UUID, user_id: uuid.UUID) -> None:
    """Delete an entry (must be owned by user)."""
    entry = await get_entry_by_id(db, entry_id, user_id)
    await db.delete(entry)
    await db.commit()
