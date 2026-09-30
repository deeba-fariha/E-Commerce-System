from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.customer import User
from ..core.dependencies import get_current_admin
from ..schemas.customer import AdminCustomerResponse


# =========================================================
# ROUTER (admin only)
# =========================================================
# Include in main.py BEFORE admin_auth, otherwise
# GET /api/admin/{admin_id} would catch /api/admin/customers.

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin - Customers"],
    dependencies=[Depends(get_current_admin)]
)


# =========================================================
# LIST CUSTOMERS
# =========================================================
# GET /api/admin/customers
# GET /api/admin/customers?search=rakib   (name or email)

@router.get(
    "/customers",
    response_model=list[AdminCustomerResponse]
)
def list_customers(
    search: Optional[str] = Query(default=None, max_length=100),
    db: Session = Depends(get_db)
):
    query = db.query(User)

    term = (search or "").strip()

    if term:
        pattern = f"%{term.lower()}%"
        full_name = func.lower(User.first_name + " " + User.last_name)

        query = query.filter(
            or_(
                func.lower(User.first_name).like(pattern),
                func.lower(User.last_name).like(pattern),
                full_name.like(pattern),
                func.lower(User.email).like(pattern),
            )
        )

    # Newest registrations first
    return query.order_by(User.id.desc()).all()
