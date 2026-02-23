"""Food entry API: create, list, get, update, delete meal entries."""
import uuid
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.food_entry import MealType
from app.schemas.food_entry import FoodEntryCreate, FoodEntryUpdate, FoodEntryResponse, PaginatedFoodEntries
from app.services import entry_service

router = APIRouter(prefix="/api/entries", tags=["entries"])


@router.post("/", response_model=FoodEntryResponse, status_code=201)
async def create_entry(
    data: FoodEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new food entry for the current user."""
    entry = await entry_service.create_entry(db, current_user.id, data)
    return FoodEntryResponse.model_validate(entry)


@router.get("/", response_model=PaginatedFoodEntries)
async def list_entries(
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    meal_type: MealType | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List food entries for a date range with optional meal filter and pagination."""
    result = await entry_service.get_entries(
        db, current_user.id, start_date, end_date, meal_type, page, page_size
    )
    return PaginatedFoodEntries(
        items=[FoodEntryResponse.model_validate(e) for e in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.get("/{entry_id}", response_model=FoodEntryResponse)
async def get_entry(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch a single food entry by ID."""
    entry = await entry_service.get_entry_by_id(db, entry_id, current_user.id)
    return FoodEntryResponse.model_validate(entry)


@router.put("/{entry_id}", response_model=FoodEntryResponse)
async def update_entry(
    entry_id: uuid.UUID,
    data: FoodEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing food entry."""
    entry = await entry_service.update_entry(db, entry_id, current_user.id, data)
    return FoodEntryResponse.model_validate(entry)


@router.delete("/{entry_id}", status_code=204)
async def delete_entry(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a food entry."""
    await entry_service.delete_entry(db, entry_id, current_user.id)
