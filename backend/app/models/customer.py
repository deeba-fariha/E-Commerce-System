from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
)
from sqlalchemy.sql import func

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    first_name = Column(
        String(100),
        nullable=False
    )

    last_name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(
        String(255),
        nullable=False
    )

    # Added later: existing databases get these columns from
    # app/migrations.py when the server starts.
    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False
    )

    last_login_at = Column(
        DateTime(timezone=True),
        nullable=True
    )


class Order(Base):
    __tablename__ = "orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    full_name = Column(
        String(255),
        nullable=False
    )

    phone = Column(
        String(50),
        nullable=False
    )

    street_address = Column(
        String(500),
        nullable=False
    )

    city = Column(
        String(100),
        nullable=False
    )

    postal_code = Column(
        String(20),
        nullable=False
    )

    order_note = Column(
        String(1000),
        nullable=True
    )

    subtotal = Column(
        Float,
        nullable=False
    )

    shipping = Column(
        Float,
        nullable=False,
        default=0
    )

    discount = Column(
        Float,
        nullable=False,
        default=0
    )

    total = Column(
        Float,
        nullable=False
    )

    status = Column(
        String(50),
        nullable=False,
        default="Pending"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False,
        default=1
    )

    unit_price = Column(
        Float,
        nullable=False
    )


class Review(Base):
    __tablename__ = "reviews"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    rating = Column(
        Integer,
        nullable=False
    )

    review = Column(
        String(2000),
        nullable=False
    )


class Wishlist(Base):
    __tablename__ = "wishlist"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )