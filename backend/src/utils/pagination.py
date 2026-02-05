"""
Pagination utilities for API responses
"""

from typing import List, Dict, Any, Optional
from flask import request


def paginate(
    items: List[Any], page: int = 1, per_page: int = 10, max_per_page: int = 100
) -> Dict[str, Any]:
    """
    Paginate a list of items.

    Args:
        items: The list of items to paginate
        page: Current page number (1-indexed)
        per_page: Number of items per page
        max_per_page: Maximum allowed items per page

    Returns:
        Dict containing pagination metadata and items
    """
    # Validate inputs
    page = max(1, int(page))
    per_page = min(max(1, int(per_page)), max_per_page)

    total = len(items)
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = min(page, total_pages)

    # Calculate start and end indices
    start = (page - 1) * per_page
    end = min(start + per_page, total)

    # Get items for current page
    paginated_items = items[start:end]

    return {
        "items": paginated_items,
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "total_items": total,
            "has_next": page < total_pages,
            "has_prev": page > 1,
            "next_page": page + 1 if page < total_pages else None,
            "prev_page": page - 1 if page > 1 else None,
        },
    }


def get_pagination_params(default_per_page: int = 10, max_per_page: int = 100) -> tuple:
    """
    Get pagination parameters from request query string.

    Returns:
        tuple: (page, per_page)
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", default_per_page, type=int)

    # Validate
    page = max(1, page)
    per_page = min(max(1, per_page), max_per_page)

    return page, per_page


def paginate_mongodb_cursor(
    cursor, page: int = 1, per_page: int = 10, max_per_page: int = 100
) -> Dict[str, Any]:
    """
    Paginate a MongoDB cursor with count optimization.

    Args:
        cursor: MongoDB cursor
        page: Current page number (1-indexed)
        per_page: Number of items per page
        max_per_page: Maximum allowed items per page

    Returns:
        Dict containing pagination metadata and items
    """
    from pymongo import ASCENDING, DESCENDING

    # Validate inputs
    page = max(1, int(page))
    per_page = min(max(1, int(per_page)), max_per_page)

    # Get total count (use count_documents for better performance)
    total = cursor.collection.count_documents(cursor.filter)

    total_pages = max(1, (total + per_page - 1) // per_page)
    page = min(page, total_pages)

    # Calculate skip
    skip = (page - 1) * per_page

    # Get items for current page
    paginated_items = list(cursor.skip(skip).limit(per_page))

    return {
        "items": paginated_items,
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "total_items": total,
            "has_next": page < total_pages,
            "has_prev": page > 1,
            "next_page": page + 1 if page < total_pages else None,
            "prev_page": page - 1 if page > 1 else None,
        },
    }


def create_pagination_response(
    items: List[Any], page: int, per_page: int, total: int
) -> Dict[str, Any]:
    """
    Create a standardized pagination response.

    Args:
        items: List of items for current page
        page: Current page number
        per_page: Items per page
        total: Total number of items

    Returns:
        Dict with items and pagination metadata
    """
    total_pages = max(1, (total + per_page - 1) // per_page)

    return {
        "items": items,
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "total_items": total,
            "has_next": page < total_pages,
            "has_prev": page > 1,
            "next_page": page + 1 if page < total_pages else None,
            "prev_page": page - 1 if page > 1 else None,
        },
    }
