from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey,
    Text,
    Numeric,
    DateTime,
    JSON,
)
from sqlalchemy.sql import func

from ..database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =========================
    # SELLER FIELDS
    # =========================

    seller_id = Column(
        Integer,
        ForeignKey("sellers.id"),
        nullable=True,
        index=True
    )

    # Who added the product: "seller" (seller_id set, needs admin
    # approval) or "admin" (seller_id empty, live immediately).
    added_by_role = Column(
        String(20),
        nullable=False,
        default="seller",
        server_default="seller"
    )

    name = Column(
        String(255),
        nullable=False
    )

    # One category -> many products. Nullable only so existing rows
    # could be linked by app/migrations.py; the API always sets it.
    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=True,
        index=True
    )

    # Copy of the category's slug (e.g. "electronics"), kept in sync
    # with category_id; the storefront filters by it.
    category = Column(
        String(100),
        nullable=False
    )

    brand = Column(
        String(255),
        nullable=True
    )

    badge = Column(
        String(100),
        nullable=True
    )

    stock = Column(
        Integer,
        nullable=False,
        default=0
    )

    description = Column(
        Text,
        nullable=False
    )

    features = Column(
        JSON,
        nullable=True
    )

    old_price = Column(
        Numeric(10, 2),
        nullable=True
    )

    discount = Column(
        Numeric(5, 2),
        nullable=False,
        default=0
    )

    price = Column(
        Numeric(10, 2),
        nullable=False
    )

    image = Column(
        Text,
        nullable=True
    )

    rating = Column(
        Numeric(3, 2),
        nullable=False,
        default=0
    )

    reviews = Column(
        Integer,
        nullable=False,
        default=0
    )

    status = Column(
        String(20),
        nullable=False,
        default="Pending"
    )

    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # =========================
    # CUSTOMER FIELDS
    # =========================

    category_name = Column(
        String(100),
        nullable=True
    )

    reviews_count = Column(
        Integer,
        nullable=False,
        default=0
    )

    badge_type = Column(
        String(50),
        nullable=True
    )

    in_stock = Column(
        Boolean,
        nullable=True,
        default=True
    )