from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from ..database import get_db
from ..models.admin import Admin
from ..schemas.admin import (
    AdminCreate,
    AdminLogin,
    AdminResponse,
)


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


password_hash = PasswordHash.recommended()


# =========================================================
# ADMIN REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=AdminResponse,
    status_code=201
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

@router.post("/login")
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
        "message": "Admin login successful.",
        "admin_id": admin.id,
        "username": admin.username,
        "email": admin.email
    }


# =========================================================
# GET ADMIN PROFILE
# =========================================================

@router.get(
    "/{admin_id}",
    response_model=AdminResponse
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