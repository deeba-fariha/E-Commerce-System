from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.category import Category
from ..schemas.category import CategoryResponse


def get_category_or_400(
    db: Session,
    category_id: Optional[int] = None,
    slug: Optional[str] = None
) -> Category:
    """
    The category a product is being saved under, by id (preferred)
    or slug. Raises 400 with a clear message if it doesn't exist.
    """
    query = db.query(Category)

    if category_id is not None:
        category = query.filter(Category.id == category_id).first()
    else:
        category = query.filter(Category.slug == (slug or "").strip().lower()).first()

    if not category:
        raise HTTPException(
            status_code=400,
            detail="The selected category does not exist. Please refresh and choose another."
        )

    return category


def apply_category(product, category: Category):
    """Links a product to a category and keeps the text copies in sync."""
    product.category_id = category.id
    product.category = category.slug
    product.category_name = category.name


router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"]
)


# =========================================================
# ALL CATEGORIES (public)
# =========================================================
# Used by the home page (search dropdown, filter pills, footer)
# and the seller/admin "Add Product" forms.

@router.get(
    "",
    response_model=list[CategoryResponse]
)
def list_categories(
    db: Session = Depends(get_db)
):
    return (
        db.query(Category)
        .order_by(Category.id.asc())
        .all()
    )
