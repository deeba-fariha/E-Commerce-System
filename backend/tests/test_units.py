"""
Unit tests for pure helper functions (no HTTP, no database rows).

Test IDs (UT-xx) match the unit test table in the project report.
"""

from datetime import datetime, timedelta, timezone

import jwt
import pytest
from pydantic import ValidationError

from app.core.config import JWT_SECRET_KEY, JWT_ALGORITHM
from app.core.security import (
    create_access_token,
    decode_access_token,
    is_password_hash,
    password_hash,
    verify_customer_password,
)
from app.schemas.category import CategoryCreate, slugify


def test_ut01_slugify():
    assert slugify("Home & Living") == "home-living"
    assert slugify("  Audio   Sound ") == "audio-sound"
    assert slugify("Books & Stationery!") == "books-stationery"


def test_ut02_token_round_trip():
    token = create_access_token(42, "seller")
    assert decode_access_token(token) == ("seller", 42)


def test_ut03_invalid_tokens_are_rejected():
    assert decode_access_token("not-a-token") is None

    expired = jwt.encode(
        {"sub": "1", "role": "admin",
         "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        JWT_SECRET_KEY, algorithm=JWT_ALGORITHM,
    )
    assert decode_access_token(expired) is None

    wrong_secret = jwt.encode(
        {"sub": "1", "role": "admin",
         "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        "some-other-secret-key-that-is-long-enough", algorithm=JWT_ALGORITHM,
    )
    assert decode_access_token(wrong_secret) is None

    with pytest.raises(ValueError):
        create_access_token(1, "superuser")


def test_ut04_customer_password_check():
    hashed = password_hash.hash("secret123")
    assert is_password_hash(hashed)
    assert verify_customer_password("secret123", hashed)
    assert not verify_customer_password("wrong", hashed)

    # legacy plain-text value stored before hashing was introduced
    assert not is_password_hash("secret123")
    assert verify_customer_password("secret123", "secret123")
    assert not verify_customer_password("wrong", "secret123")


def test_ut05_category_validation():
    data = CategoryCreate(name="  Home   Office ", icon="bi-laptop")
    assert data.name == "Home Office"
    assert data.icon == "laptop"
    assert data.slug is None

    with pytest.raises(ValidationError):
        CategoryCreate(name="Toys", image="ftp://example.com/toy.png")

    with pytest.raises(ValidationError):
        CategoryCreate(name="Toys", icon="<script>")
