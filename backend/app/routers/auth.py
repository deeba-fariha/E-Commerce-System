from fastapi import APIRouter, Depends

from ..core.dependencies import CurrentUser, get_current_user


router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"]
)


# =========================================================
# WHO AM I (any role)
# =========================================================
# Used by js/auth.js on every page to confirm the stored
# login is still valid and to refresh the navbar name.

def session_profile(role: str, account) -> dict:
    if role == "customer":
        first_name = account.first_name
        full_name = f"{account.first_name} {account.last_name}".strip()
    elif role == "seller":
        first_name = account.store_name.split(" ")[0]
        full_name = account.store_name
    else:
        first_name = account.username.split(" ")[0]
        full_name = account.username

    return {
        "role": role,
        "id": account.id,
        "first_name": first_name,
        "name": full_name,
        "email": account.email,
    }


@router.get("/me")
def get_me(
    current: CurrentUser = Depends(get_current_user)
):
    return session_profile(current.role, current.account)
