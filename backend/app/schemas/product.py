from typing import Optional, List
from decimal import Decimal
from datetime import datetime

from pydantic import (
    AliasChoices,
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


# =========================================================
# CREATE PRODUCT
# =========================================================

class CategoryChoice(BaseModel):
    """
    A product's category: send category_id (preferred), or the
    category's slug as "category" (older forms). One is required
    when creating; the backend checks the category exists.
    """
    category_id: Optional[int] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def require_category(self):
        if self.category_id is None and not (self.category or "").strip():
            raise ValueError("Please choose a category (category_id).")
        return self


class ProductCreate(CategoryChoice):
    seller_id: int

    name: str = Field(..., max_length=255)
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
    added_by_role: str = "seller"

    name: str
    category_id: Optional[int] = None
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
# ADMIN PRODUCT REVIEW
# =========================================================

# Pending  -> waiting for admin review (set when a seller adds a product)
# Approved -> shown on the homepage
# Rejected -> declined by admin
PRODUCT_STATUSES = ("Pending", "Approved", "Rejected")


class AdminProductResponse(ProductResponse):
    seller_store_name: Optional[str] = None
    created_at: Optional[datetime] = None


# =========================================================
# ADMIN: ADD PRODUCT (live immediately, no seller)
# =========================================================

class AdminProductCreate(BaseModel):
    category_id: int = Field(..., gt=0)

    name: str = Field(..., min_length=1, max_length=255)
    brand: Optional[str] = Field(default=None, max_length=255)
    badge: Optional[str] = Field(default=None, max_length=100)

    stock: int = Field(..., ge=0)

    description: str = Field(..., min_length=1)
    features: List[str] = Field(default_factory=list)

    price: Decimal = Field(..., gt=0)

    # Optional "was" price, shown crossed out on the storefront
    old_price: Optional[Decimal] = Field(
        default=None,
        gt=0,
        validation_alias=AliasChoices("old_price", "oldPrice")
    )

    image: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name", "description")
    @classmethod
    def not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field is required.")
        return value

    @model_validator(mode="after")
    def old_price_above_price(self):
        if self.old_price is not None and self.old_price <= self.price:
            raise ValueError("Old price must be higher than the price.")
        return self


# =========================================================
# UPDATE PRODUCT
# =========================================================

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    # Change category with category_id (or the slug as "category")
    category_id: Optional[int] = Field(default=None, gt=0)
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