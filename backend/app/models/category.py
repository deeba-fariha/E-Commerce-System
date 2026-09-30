from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from ..database import Base


class Category(Base):
    """
    Product category (one category -> many products).

    slug is the URL/filter key the storefront uses (e.g. "electronics");
    products.category keeps a copy of it for the existing pages.
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), unique=True, nullable=False)

    slug = Column(String(120), unique=True, nullable=False, index=True)

    # Bootstrap Icons name without the "bi-" prefix, e.g. "laptop"
    icon = Column(String(60), nullable=True)

    # Optional image URL or "/uploads/..." path
    image = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self):
        return f"<Category(id={self.id}, slug='{self.slug}')>"
