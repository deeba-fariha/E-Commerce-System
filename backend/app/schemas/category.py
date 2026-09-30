import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


def slugify(value: str) -> str:
    """"Home & Living" -> "home-living" """
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

    # Optional: generated from the name when left empty
    slug: Optional[str] = Field(default=None, max_length=120)

    # Bootstrap Icons name, e.g. "laptop" or "bi-laptop"
    icon: Optional[str] = Field(default=None, max_length=60)

    # Image URL or "/uploads/..." path
    image: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value:
            raise ValueError("Category name is required.")
        return value

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        slug = slugify(value)
        if not slug:
            raise ValueError("Slug must contain letters or numbers.")
        return slug

    @field_validator("icon")
    @classmethod
    def clean_icon(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        value = value.strip()
        value = value[3:] if value.startswith("bi-") else value
        if not re.fullmatch(r"[a-z0-9-]+", value):
            raise ValueError("Icon must be a Bootstrap Icons name, e.g. \"laptop\".")
        return value

    @field_validator("image")
    @classmethod
    def clean_image(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        value = value.strip()
        if not (value.startswith("http://") or value.startswith("https://") or value.startswith("/uploads/")):
            raise ValueError("Image must be an http(s) URL.")
        return value


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str] = None
    image: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminCategoryResponse(CategoryResponse):
    """Category with product counts, for the Admin Panel."""
    product_count: int = 0      # all statuses, admin + seller
    approved_count: int = 0
    pending_count: int = 0
    declined_count: int = 0
