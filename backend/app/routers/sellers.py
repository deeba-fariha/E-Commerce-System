from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from ..database import get_db
from ..models.seller import Seller
from ..schemas.seller import SellerCreate, SellerResponse


router = APIRouter(
    prefix="/api/sellers",
    tags=["Sellers"]
)

password_hash = PasswordHash.recommended()


# =========================================================
# SELLER REGISTRATION
# =========================================================

@router.post(
    "/register",
    response_model=SellerResponse,
    status_code=201
)
def register_seller(
    seller_data: SellerCreate,
    db: Session = Depends(get_db)
):
    existing_seller = (
        db.query(Seller)
        .filter(Seller.email == seller_data.email)
        .first()
    )

    if existing_seller:
        raise HTTPException(
            status_code=400,
            detail="A seller with this email already exists."
        )

    hashed_password = password_hash.hash(
        seller_data.password
    )

    new_seller = Seller(
        store_name=seller_data.store_name,
        category=seller_data.category,
        email=seller_data.email,
        phone=seller_data.phone,
        password_hash=hashed_password,
        revenue_tier=seller_data.revenue_tier,
    )

    db.add(new_seller)
    db.commit()
    db.refresh(new_seller)

    return new_seller


# =========================================================
# SELLER LOGIN
# =========================================================

@router.post("/login")
def login_seller(
    login_data: dict,
    db: Session = Depends(get_db)
):
    email = login_data.get("email")
    password = login_data.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=400,
            detail="Email and password are required."
        )

    seller = (
        db.query(Seller)
        .filter(Seller.email == email)
        .first()
    )

    if not seller:
        raise HTTPException(
            status_code=401,
            detail="Wrong email or password."
        )

    if not password_hash.verify(
        password,
        seller.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Wrong email or password."
        )

    return {
        "message": "Seller login successful.",
        "seller_id": seller.id,
        "store_name": seller.store_name,
        "email": seller.email,
    }


# =========================================================
# GET SELLER PROFILE
# =========================================================

@router.get("/{seller_id}")
def get_seller_profile(
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
    }



# =========================================================
# SELLER DASHBOARD DATA
# =========================================================

from ..models.product import Product


@router.get("/{seller_id}/dashboard")
def get_seller_dashboard(
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


    live_products = (
        db.query(Product)
        .filter(
            Product.seller_id == seller_id,
            Product.status == "Approved"
        )
        .count()
    )


    pending_products = (
        db.query(Product)
        .filter(
            Product.seller_id == seller_id,
            Product.status == "Pending"
        )
        .count()
    )


    total_products = (
        db.query(Product)
        .filter(
            Product.seller_id == seller_id
        )
        .count()
    )


    return {

        "seller": {
            "id": seller.id,
            "store_name": seller.store_name,
            "category": seller.category,
            "email": seller.email,
            "phone": seller.phone,
            "revenue_tier": seller.revenue_tier
        },


        "statistics": {

            "live_products": live_products,

            "pending_products": pending_products,

            "total_products": total_products

        }
    }


# =========================================================
# UPDATE SELLER PROFILE
# =========================================================

@router.put("/{seller_id}")
def update_seller_profile(
    seller_id: int,
    seller_data: dict,
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

    store_name = seller_data.get("store_name")
    category = seller_data.get("category")
    email = seller_data.get("email")
    phone = seller_data.get("phone")
    password = seller_data.get("password")
    revenue_tier = seller_data.get("revenue_tier")

    if email and email != seller.email:
        existing_seller = (
            db.query(Seller)
            .filter(
                Seller.email == email,
                Seller.id != seller_id
            )
            .first()
        )

        if existing_seller:
            raise HTTPException(
                status_code=400,
                detail="This email is already registered to another seller."
            )

        seller.email = email

    if store_name:
        seller.store_name = store_name

    if category:
        seller.category = category

    if phone:
        seller.phone = phone

    if revenue_tier:
        seller.revenue_tier = revenue_tier

    if password:
        seller.password_hash = password_hash.hash(password)

    db.commit()
    db.refresh(seller)

    return {
        "message": "Seller profile updated successfully.",
        "seller_id": seller.id,
        "store_name": seller.store_name,
        "category": seller.category,
        "email": seller.email,
        "phone": seller.phone,
        "revenue_tier": seller.revenue_tier,
    }