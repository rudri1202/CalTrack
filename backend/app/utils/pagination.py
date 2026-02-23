"""Pagination helpers for list endpoints."""
import math


def paginate(total: int, page: int, page_size: int) -> dict:
    """Calculate pagination metadata."""
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_offset(page: int, page_size: int) -> int:
    """Compute SQL OFFSET from page and page_size."""
    return (page - 1) * page_size
