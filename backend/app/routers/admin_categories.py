from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, case
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.category import Category
from ..models.product import Product
from ..models.seller import Seller
from ..core.dependencies import get_current_admin
from ..schemas.category import (
    AdminCategoryResponse,
    CategoryCreate,
    CategoryResponse,
    slugify,
)
from ..schemas.product import AdminProductResponse


# =========================================================
# ROUTER (admin only)
# =========================================================
# Include in main.py BEFORE admin_auth (see admin_customers.py).

router = APIRouter(
    prefix="/api/admin/categories",
    tags=["Admin - Categories"],
    dependencies=[Depends(get_current_admin)]
)


# =========================================================
# LIST CATEGORIES WITH PRODUCT COUNTS
# =========================================================

@router.get(
    "",
    response_model=list[AdminCategoryResponse]
)
def list_categories_with_counts(
    db: Session = Depends(get_db)
):
    def count_status(status: str):
        return func.count(case((Product.status == status, 1)))

    rows = (
        db.query(
            Category,
            func.count(Product.id).label("total"),
            count_status("Approved").label("approved"),
            count_status("Pending").label("pending"),
            count_status("Rejected").label("rejected"),
        )
        .outerjoin(Product, Product.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.id.asc())
        .all()
    )

    return [
        AdminCategoryResponse.model_validate(category).model_copy(update={
            "product_count": total,
            "approved_count": approved,
            "pending_count": pending,
            "declined_count": rejected,
        })
        for category, total, approved, pending, rejected in rows
    ]


# =========================================================
# ALL PRODUCTS IN ONE CATEGORY (admin + seller, any status)
# =========================================================
# GET /api/admin/categories/3/products
#     ?status=approved|pending|declined
#     &added_by=admin|seller
#     &search=headphones

STATUS_FILTERS = {
    "approved": "Approved",
    "pending": "Pending",
    "declined": "Rejected",   # stored as "Rejected"
    "rejected": "Rejected",
}


@router.get(
    "/{category_id}/products",
    response_model=list[AdminProductResponse]
)
def list_category_products(
    category_id: int,
    status: Optional[str] = Query(default=None),
    added_by: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None, max_length=100),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found."
        )

    query = (
        db.query(Product, Seller.store_name)
        .outerjoin(Seller, Seller.id == Product.seller_id)
        .filter(Product.category_id == category_id)
    )

    if status:
        stored = STATUS_FILTERS.get(status.lower())
        if not stored:
            raise HTTPException(
                status_code=400,
                detail="Status must be approved, pending or declined."
            )
        query = query.filter(Product.status == stored)

    if added_by:
        if added_by.lower() not in ("admin", "seller"):
            raise HTTPException(
                status_code=400,
                detail="added_by must be admin or seller."
            )
        query = query.filter(Product.added_by_role == added_by.lower())

    term = (search or "").strip()
    if term:
        query = query.filter(func.lower(Product.name).like(f"%{term.lower()}%"))

    rows = query.order_by(Product.id.desc()).all()

    return [
        AdminProductResponse.model_validate(product).model_copy(
            update={"seller_store_name": store_name}
        )
        for product, store_name in rows
    ]


# =========================================================
# ADD CATEGORY
# =========================================================

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=201
)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db)
):
    slug = data.slug or slugify(data.name)

    if not slug:
        raise HTTPException(
            status_code=400,
            detail="Please enter a category name with letters or numbers."
        )

    # Names are unique ignoring case ("Books" == "books")
    name_taken = (
        db.query(Category)
        .filter(func.lower(Category.name) == data.name.lower())
        .first()
    )

    if name_taken:
        raise HTTPException(
            status_code=409,
            detail=f'A category named "{name_taken.name}" already exists.'
        )

    slug_taken = (
        db.query(Category)
        .filter(Category.slug == slug)
        .first()
    )

    if slug_taken:
        raise HTTPException(
            status_code=409,
            detail=(
                f'The slug "{slug}" is already used by "{slug_taken.name}". '
                "Please choose a different slug."
            )
        )

    category = Category(
        name=data.name,
        slug=slug,
        icon=data.icon,
        image=data.image,
    )

    try:
        db.add(category)
        db.commit()
        db.refresh(category)

    except IntegrityError:
        # Two admins adding the same category at the same moment
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="A category with this name or slug already exists."
        )

    return category
