from dataclasses import dataclass

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.admin import Admin
from ..models.seller import Seller
from ..models.customer import User
from .security import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)

ROLE_MODELS = {
    "admin": Admin,
    "seller": Seller,
    "customer": User,
}


@dataclass
class CurrentUser:
    role: str
    account: Admin | Seller | User


# =========================================================
# CURRENT LOGGED-IN USER (any role)
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> CurrentUser:

    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Login required."
        )

    decoded = decode_access_token(credentials.credentials)

    if decoded is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login token."
        )

    role, account_id = decoded
    model = ROLE_MODELS[role]

    account = (
        db.query(model)
        .filter(model.id == account_id)
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=401,
            detail="Account not found."
        )

    return CurrentUser(role=role, account=account)


def require_role(role: str):
    """Dependency factory: the logged-in account for one role, else 401/403."""

    def dependency(
        current: CurrentUser = Depends(get_current_user)
    ):
        if current.role != role:
            raise HTTPException(
                status_code=403,
                detail=f"This action requires a {role} account."
            )

        return current.account

    return dependency


get_current_admin = require_role("admin")
get_current_seller = require_role("seller")
get_current_customer = require_role("customer")
