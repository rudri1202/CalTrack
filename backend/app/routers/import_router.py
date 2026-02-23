"""PDF bulk import endpoint: parse a nutrition-table PDF and insert entries."""
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.food_entry import FoodEntry, MealType
from app.services.pdf_import_service import parse_pdf

router = APIRouter(prefix="/api/import", tags=["import"])

_MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB


class ImportResult(BaseModel):
    imported: int
    failed: int
    errors: list[str]


@router.post("/pdf", response_model=ImportResult)
async def import_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Parse a nutrition-table PDF and bulk-insert entries into the user's history."""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()
    if len(contents) > _MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    parsed_entries, parse_errors = parse_pdf(contents)

    imported = 0
    all_errors: list[str] = list(parse_errors)

    for e in parsed_entries:
        try:
            entry = FoodEntry(
                user_id=current_user.id,
                meal_type=MealType(e['meal_type']),
                food_name=e['food_name'],
                quantity=float(e['quantity']),
                quantity_unit=str(e['quantity_unit']),
                calories=float(e['calories']),
                protein_g=float(e['protein_g']),
                carbs_g=float(e['carbs_g']),
                fat_g=float(e['fat_g']),
                logged_at=date.fromisoformat(e['logged_at']),
            )
            db.add(entry)
            imported += 1
        except Exception as exc:
            all_errors.append(f"Failed to save '{e.get('food_name', '?')}': {exc}")

    if imported > 0:
        await db.commit()

    return ImportResult(
        imported=imported,
        failed=len(parsed_entries) - imported,
        errors=all_errors,
    )
