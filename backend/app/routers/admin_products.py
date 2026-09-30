from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.product import Product
from ..models.seller import Seller
from ..core.dependencies import get_current_admin
from ..schemas.product import (
    AdminProductCreate,
    AdminProductResponse,
    PRODUCT_STATUSES,
)
from .categories import get_category_or_400, apply_category


# =========================================================
# ROUTER
# =========================================================
# Every endpoint here requires a logged-in admin (JWT).
#
# NOTE: include this router in main.py BEFORE admin_auth,
# otherwise GET /api/admin/{admin_id} would catch
# /api/admin/products and /api/admin/sellers.

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin - Product Approval"],
    dependencies=[Depends(get_current_admin)]
)


def to_admin_product(product: Product, store_name: Optional[str]):
    return AdminProductResponse.model_validate(product).model_copy(
        update={"seller_store_name": store_name}
    )


# =========================================================
# LIST PRODUCTS FOR REVIEW
# =========================================================
# GET /api/admin/products?status=Pending
# GET /api/admin/products?seller_id=3

@router.get(
    "/products",
    response_model=list[AdminProductResponse]
)
def list_products(
    status: Optional[str] = Query(default=None),
    seller_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = (
        db.query(Product, Seller.store_name)
        .outerjoin(Seller, Seller.id == Product.seller_id)
    )

    if status:
        if status not in PRODUCT_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Status must be one of: {', '.join(PRODUCT_STATUSES)}."
            )

        query = query.filter(Product.status == status)

    if seller_id is not None:
        query = query.filter(Product.seller_id == seller_id)

    # Oldest request first, so the queue is reviewed in order
    rows = query.order_by(Product.created_at.asc(), Product.id.asc()).all()

    return [
        to_admin_product(product, store_name)
        for product, store_name in rows
    ]


# =========================================================
# ADD PRODUCT AS ADMIN
# =========================================================
# Admin products have no seller and go live immediately
# (status "Approved"), so they appear on the home page at once.

@router.post(
    "/products",
    response_model=AdminProductResponse,
    status_code=201
)
def create_admin_product(
    data: AdminProductCreate,
    db: Session = Depends(get_db)
):
    category = get_category_or_400(db, category_id=data.category_id)

    discount = Decimal("0")
    if data.old_price:
        discount = ((data.old_price - data.price) / data.old_price * 100).quantize(Decimal("0.01"))

    product = Product(
        seller_id=None,
        added_by_role="admin",
        status="Approved",

        name=data.name,
        brand=data.brand,
        badge=data.badge,
        badge_type=data.badge,

        stock=data.stock,
        in_stock=data.stock > 0,

        description=data.description,
        features=[f.strip() for f in data.features if f.strip()],

        price=data.price,
        old_price=data.old_price,
        discount=discount,

        image=data.image,

        rating=0,
        reviews=0,
        reviews_count=0,
    )

    # Sets category_id + the category / category_name text copies
    apply_category(product, category)

    try:
        db.add(product)
        db.commit()
        db.refresh(product)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to save the product."
        )

    return to_admin_product(product, None)


# =========================================================
# APPROVE / REJECT
# =========================================================

def set_product_status(
    product_id: int,
    new_status: str,
    db: Session
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    product.status = new_status

    try:
        db.commit()
        db.refresh(product)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update product status."
        )

    store_name = (
        db.query(Seller.store_name)
        .filter(Seller.id == product.seller_id)
        .scalar()
    )

    return to_admin_product(product, store_name)


@router.patch(
    "/products/{product_id}/approve",
    response_model=AdminProductResponse
)
def approve_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    # Approved products are returned by /api/products/approved,
    # which is what the homepage loads.
    return set_product_status(product_id, "Approved", db)


@router.patch(
    "/products/{product_id}/reject",
    response_model=AdminProductResponse
)
def reject_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    return set_product_status(product_id, "Rejected", db)


# =========================================================
# SELLERS WITH PRODUCT COUNTS
# =========================================================

@router.get("/sellers")
def list_sellers(
    db: Session = Depends(get_db)
):
    def count_status(status: str):
        return func.count(
            case((Product.status == status, 1))
        )

    rows = (
        db.query(
            Seller,
            count_status("Pending").label("pending"),
            count_status("Approved").label("approved"),
            count_status("Rejected").label("rejected"),
        )
        .outerjoin(Product, Product.seller_id == Seller.id)
        .group_by(Seller.id)
        .order_by(Seller.id.desc())
        .all()
    )

    return [
        {
            "id": seller.id,
            "store_name": seller.store_name,
            "category": seller.category,
            "email": seller.email,
            "phone": seller.phone,
            "revenue_tier": seller.revenue_tier,
            "created_at": seller.created_at,
            "pending_products": pending,
            "approved_products": approved,
            "rejected_products": rejected,
        }
        for seller, pending, approved, rejected in rows
    ]


@router.get("/sellers/{seller_id}")
def get_seller(
    seller_id: int,
    db: Session = Depends(get_db)
):
    seller = (
        db.query(Seller)
        .filter(Seller.id == seller_id)
        .first()
    )

    if not seller:
        raise HTTPException(
            status_code=404,
            detail="Seller not found."
        )

    return {
        "id": seller.id,
        "store_name": seller.store_name,
        "category": seller.category,
        "email": seller.email,
        "phone": seller.phone,
        "revenue_tier": seller.revenue_tier,
        "created_at": seller.created_at,
    }
