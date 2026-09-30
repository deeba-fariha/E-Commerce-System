from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.admin import Admin
from ..core.security import password_hash, create_admin_token
from ..core.dependencies import get_current_admin
from ..schemas.admin import (
    AdminCreate,
    AdminLogin,
    AdminUpdate,
    AdminResponse,
    AdminLoginResponse,
)


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


# =========================================================
# ADMIN REGISTER (only a logged-in admin can add another)
# =========================================================
# The very first admin is created with: python -m app.init_admin

@router.post(
    "/register",
    response_model=AdminResponse,
    status_code=201,
    dependencies=[Depends(get_current_admin)]
)
def register_admin(
    admin_data: AdminCreate,
    db: Session = Depends(get_db)
):
    existing_admin = (
        db.query(Admin)
        .filter(
            (Admin.email == admin_data.email) |
            (Admin.username == admin_data.username)
        )
        .first()
    )

    if existing_admin:
        raise HTTPException(
            status_code=400,
            detail="Admin username or email already exists."
        )

    new_admin = Admin(
        username=admin_data.username,
        email=admin_data.email,
        password_hash=password_hash.hash(
            admin_data.password
        )
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return new_admin


# =========================================================
# ADMIN LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=AdminLoginResponse
)
def login_admin(
    login_data: AdminLogin,
    db: Session = Depends(get_db)
):
    admin = (
        db.query(Admin)
        .filter(Admin.email == login_data.email)
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=401,
            detail="Wrong email or password."
        )

    if not password_hash.verify(
        login_data.password,
        admin.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Wrong email or password."
        )

    return {
        "access_token": create_admin_token(admin.id),
        "token_type": "bearer",
        "admin": admin
    }


# =========================================================
# CURRENT ADMIN (used by the Admin Panel auth guard)
# =========================================================

@router.get(
    "/me",
    response_model=AdminResponse
)
def get_me(
    admin: Admin = Depends(get_current_admin)
):
    return admin


# =========================================================
# UPDATE ADMIN PROFILE
# =========================================================

@router.put(
    "/profile",
    response_model=AdminResponse
)
def update_profile(
    admin_data: AdminUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if admin_data.username and admin_data.username != admin.username:
        taken = (
            db.query(Admin)
            .filter(
                Admin.username == admin_data.username,
                Admin.id != admin.id
            )
            .first()
        )

        if taken:
            raise HTTPException(
                status_code=400,
                detail="This username is already taken."
            )

        admin.username = admin_data.username

    if admin_data.password:
        admin.password_hash = password_hash.hash(
            admin_data.password
        )

    db.commit()
    db.refresh(admin)

    return admin


# =========================================================
# GET ADMIN PROFILE
# =========================================================

@router.get(
    "/{admin_id}",
    response_model=AdminResponse,
    dependencies=[Depends(get_current_admin)]
)
def get_admin(
    admin_id: int,
    db: Session = Depends(get_db)
):
    admin = (
        db.query(Admin)
        .filter(Admin.id == admin_id)
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=404,
            detail="Admin not found."
        )

    return admin
