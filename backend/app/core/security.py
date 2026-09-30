import hmac
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from .config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    ADMIN_TOKEN_EXPIRE_MINUTES,
)


password_hash = PasswordHash.recommended()

ROLES = ("admin", "seller", "customer")


# =========================================================
# ACCESS TOKENS (shared by admin, seller and customer)
# =========================================================
# Payload: {"sub": "<id>", "role": "<role>", "exp": ...}

def create_access_token(user_id: int, role: str) -> str:
    if role not in ROLES:
        raise ValueError(f"Unknown role: {role}")

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ADMIN_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


def decode_access_token(token: str) -> tuple[str, int] | None:
    """Returns (role, id), or None if the token is invalid/expired."""
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
    except jwt.PyJWTError:
        return None

    role = payload.get("role")

    if role not in ROLES:
        return None

    try:
        return role, int(payload["sub"])
    except (KeyError, ValueError):
        return None


def create_admin_token(admin_id: int) -> str:
    return create_access_token(admin_id, "admin")


def decode_admin_token(token: str) -> int | None:
    """Returns the admin id, or None if the token is not a valid admin token."""
    decoded = decode_access_token(token)

    if not decoded or decoded[0] != "admin":
        return None

    return decoded[1]


# =========================================================
# CUSTOMER PASSWORDS
# =========================================================
# Customer passwords used to be saved as plain text. New and
# changed passwords are hashed; old plain-text ones are
# upgraded to a hash the next time that customer logs in.

def is_password_hash(value: str) -> bool:
    return value.startswith("$argon2") or value.startswith("$2")


def verify_customer_password(plain: str, stored: str) -> bool:
    if is_password_hash(stored):
        return password_hash.verify(plain, stored)

    return hmac.compare_digest(plain.encode(), stored.encode())
