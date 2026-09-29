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

    name = Column(
        String(255),
        nullable=False
    )

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