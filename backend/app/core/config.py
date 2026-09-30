import os

# database.py loads backend/.env, so import it first
from .. import database  # noqa: F401


# =========================================================
# JWT SETTINGS
# =========================================================

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "change-this-secret-key-in-env"
)

JWT_ALGORITHM = "HS256"

ADMIN_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ADMIN_TOKEN_EXPIRE_MINUTES", "720")
)
