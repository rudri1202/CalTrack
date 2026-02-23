"""PDF bulk import service: parse nutrition tables from PDF files.

Isolated from DB — returns (valid_entries, error_messages) only.
Caller is responsible for persisting results.
"""
from __future__ import annotations

import io
from datetime import date, datetime
from typing import Any

# Column name aliases: maps our field names → possible PDF column headers
COLUMN_ALIASES: dict[str, list[str]] = {
    'date':          ['date', 'day', 'logged_at', 'log date', 'entry date'],
    'food_name':     ['food', 'food name', 'item', 'name', 'description', 'food item', 'meal item'],
    'meal_type':     ['meal', 'meal type', 'type', 'meal name', 'meal category'],
    'calories':      ['calories', 'cal', 'kcal', 'energy', 'cals', 'total calories'],
    'protein_g':     ['protein', 'protein (g)', 'prot', 'protein g', 'protein(g)'],
    'carbs_g':       ['carbs', 'carbohydrates', 'carbs (g)', 'cho', 'carb', 'carbohydrate', 'carbs(g)'],
    'fat_g':         ['fat', 'fat (g)', 'lipids', 'total fat', 'fat g', 'fat(g)'],
    'quantity':      ['quantity', 'qty', 'amount', 'serving', 'serving size', 'portion'],
    'quantity_unit': ['unit', 'units', 'measure', 'unit of measure', 'uom'],
}

VALID_MEAL_TYPES = {'breakfast', 'lunch', 'dinner', 'snack'}

# Keywords that indicate a row is a table header
HEADER_KEYWORDS = {'date', 'food', 'food name', 'calories', 'cal', 'kcal', 'protein', 'carbs', 'item', 'name'}


def _normalize_meal_type(val: str) -> str:
    v = val.lower().strip()
    for mt in VALID_MEAL_TYPES:
        if mt in v:
            return mt
    return 'snack'


def _parse_float(val: Any) -> float | None:
    if val is None:
        return None
    try:
        return float(str(val).replace(',', '').strip())
    except (ValueError, TypeError):
        return None


def _parse_date(val: Any) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%m-%d-%Y', '%d.%m.%Y', '%Y/%m/%d'):
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None


def _map_columns(headers: list[Any]) -> dict[str, int]:
    """Map our field names to column indices based on header text."""
    normalized = [str(h).lower().strip() if h is not None else '' for h in headers]
    mapping: dict[str, int] = {}
    for field, aliases in COLUMN_ALIASES.items():
        for i, col in enumerate(normalized):
            if col in aliases:
                mapping[field] = i
                break
    return mapping


def parse_pdf(file_bytes: bytes) -> tuple[list[dict], list[str]]:
    """Parse a nutrition-table PDF.

    Returns (valid_entries, error_messages).
    Each entry dict has: food_name, calories, protein_g, carbs_g, fat_g,
                         quantity, quantity_unit, meal_type, logged_at.
    """
    try:
        import pdfplumber  # lazy import
    except ImportError:
        return [], ["pdfplumber is not installed on the server. Run: pip install pdfplumber"]

    entries: list[dict] = []
    errors: list[str] = []
    today = date.today().strftime('%Y-%m-%d')

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            all_rows: list[tuple[list[Any], int]] = []
            for page_num, page in enumerate(pdf.pages, 1):
                for table in (page.extract_tables() or []):
                    if table and len(table) > 1:
                        all_rows.extend((row, page_num) for row in table)

        if not all_rows:
            return [], ["No tables found in the PDF. Ensure your file contains tabular nutrition data."]

        # Find the header row
        header_row: list[Any] | None = None
        header_idx = 0
        for i, (row, _) in enumerate(all_rows):
            if row and any(
                str(cell).lower().strip() in HEADER_KEYWORDS
                for cell in row if cell
            ):
                header_row = row
                header_idx = i
                break

        if header_row is None:
            return [], [
                "Could not identify a header row. "
                "Expected columns like: date, food name, calories, protein, carbs, fat."
            ]

        col_map = _map_columns(header_row)
        missing = [f for f in ('food_name', 'calories') if f not in col_map]
        if missing:
            found_cols = ', '.join(str(h) for h in header_row if h)
            return [], [
                f"Required column(s) not found: {', '.join(missing)}. "
                f"Detected headers: {found_cols}"
            ]

        for row_idx, (row, _page) in enumerate(all_rows[header_idx + 1:], 1):
            # Skip blank rows
            if not row or all(cell is None or str(cell).strip() == '' for cell in row):
                continue

            def get(field: str) -> Any:
                idx = col_map.get(field)
                return row[idx] if idx is not None and idx < len(row) else None

            food_name = str(get('food_name') or '').strip()
            if not food_name:
                errors.append(f"Row {row_idx}: missing food name — skipped")
                continue

            # Skip repeated header rows (PDFs often repeat headers on each page)
            if food_name.lower() in HEADER_KEYWORDS:
                continue

            calories = _parse_float(get('calories'))
            if calories is None:
                errors.append(f"Row {row_idx} ({food_name}): invalid calories value — skipped")
                continue

            entries.append({
                'food_name':     food_name,
                'calories':      calories,
                'protein_g':     _parse_float(get('protein_g')) or 0.0,
                'carbs_g':       _parse_float(get('carbs_g')) or 0.0,
                'fat_g':         _parse_float(get('fat_g')) or 0.0,
                'quantity':      _parse_float(get('quantity')) or 1.0,
                'quantity_unit': str(get('quantity_unit') or 'serving').strip() or 'serving',
                'meal_type':     _normalize_meal_type(str(get('meal_type') or 'snack')),
                'logged_at':     _parse_date(get('date')) or today,
            })

    except Exception as exc:
        return [], [f"Failed to parse PDF: {exc}"]

    return entries, errors
