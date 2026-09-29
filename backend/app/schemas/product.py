from typing import Optional, List
from decimal import Decimal

from pydantic import BaseModel, Field


# =========================================================
# CREATE PRODUCT
# =========================================================

class ProductCreate(BaseModel):
    seller_id: int

    name: str = Field(..., max_length=255)
    category: str = Field(..., max_length=100)
    brand: str = Field(..., max_length=255)

    badge: Optional[str] = None
    stock: int = Field(..., ge=0)

    description: str
    features: List[str]

    # Frontend uses oldPrice
    # Backend/model uses old_price
    old_price: Decimal = Field(
        ...,
        gt=0,
        validation_alias="oldPrice"
    )

    discount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=95
    )

    price: Decimal = Field(
        ...,
        ge=0
    )

    image: Optional[str] = None

    rating: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=5
    )

    reviews: int = Field(
        default=0,
        ge=0
    )


# =========================================================
# PRODUCT RESPONSE
# =========================================================

class ProductResponse(BaseModel):
    id: int
    seller_id: Optional[int]

    name: str
    category: str
    brand: Optional[str]

    badge: Optional[str]
    stock: int

    description: str
    features: Optional[List[str]]

    # SQLAlchemy attribute = old_price
    # API response field = oldPrice
    old_price: Optional[Decimal] = Field(
        default=None,
        serialization_alias="oldPrice"
    )

    discount: Decimal
    price: Decimal

    image: Optional[str]

    rating: Decimal
    reviews: int
    status: str

    category_name: Optional[str] = None
    reviews_count: int = 0
    badge_type: Optional[str] = None
    in_stock: Optional[bool] = True

    class Config:
        from_attributes = True


# =========================================================
# UPDATE PRODUCT
# =========================================================

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    badge: Optional[str] = None

    stock: Optional[int] = Field(
        default=None,
        ge=0
    )

    description: Optional[str] = None
    features: Optional[List[str]] = None

    # Accept frontend oldPrice
    # Internally use old_price
    old_price: Optional[Decimal] = Field(
        default=None,
        validation_alias="oldPrice"
    )

    discount: Optional[Decimal] = None
    price: Optional[Decimal] = None

    image: Optional[str] = None

    category_name: Optional[str] = None
    badge_type: Optional[str] = None
    in_stock: Optional[bool] = None