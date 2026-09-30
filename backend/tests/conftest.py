"""
Test setup: runs the real FastAPI app against a throw-away SQLite
database, so the tests never touch the Neon database in backend/.env.

Run from the backend folder:
    python -m pytest tests -v
"""

import os
import sys
import tempfile
from pathlib import Path

import pytest

# Must be set BEFORE the app is imported: app/database.py builds the
# engine at import time, and load_dotenv() does not override variables
# that are already set.
_DB_FILE = Path(tempfile.mkdtemp()) / "apexmart_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_DB_FILE.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-pytest-only-0123456789"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models.admin import Admin  # noqa: E402
from app.core.security import password_hash  # noqa: E402


ADMIN_EMAIL = "admin@apexmart-demo.com"
ADMIN_PASSWORD = "AdminPass#1"


@pytest.fixture(scope="session")
def client():
    # raise_server_exceptions=False: a server error is returned as a
    # 500 response (what a browser would see) instead of crashing the test
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.fixture(scope="session", autouse=True)
def seed_admin(client):
    # depends on client: its start-up (lifespan) creates the tables
    """The first admin is created by `python -m app.init_admin` in real use."""
    db = SessionLocal()
    try:
        if not db.query(Admin).filter(Admin.email == ADMIN_EMAIL).first():
            db.add(Admin(
                username="Test Admin",
                email=ADMIN_EMAIL,
                password_hash=password_hash.hash(ADMIN_PASSWORD),
            ))
            db.commit()
    finally:
        db.close()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def admin_token(client):
    res = client.post("/api/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
    })
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def customer(client):
    body = {
        "first_name": "Test",
        "last_name": "Customer",
        "email": "customer@apexmart-demo.com",
        "password": "Customer#123",
    }
    res = client.post("/customer/register", json=body)
    assert res.status_code == 200, res.text

    login = client.post("/customer/login", json={
        "email": body["email"],
        "password": body["password"],
    })
    assert login.status_code == 200, login.text

    data = login.json()
    return {"id": data["user"]["id"], "token": data["access_token"], **body}


@pytest.fixture(scope="session")
def seller(client):
    body = {
        "store_name": "Test Store",
        "category": "electronics",
        "email": "seller@apexmart-demo.com",
        "phone": "01700000000",
        "password": "Seller#123",
    }
    res = client.post("/api/sellers/register", json=body)
    assert res.status_code == 201, res.text

    login = client.post("/api/sellers/login", json={
        "email": body["email"],
        "password": body["password"],
    })
    assert login.status_code == 200, login.text

    data = login.json()
    return {"id": data["seller_id"], "token": data["access_token"], **body}


@pytest.fixture(scope="session")
def category_id(client):
    """First seeded category (app/migrations.py seeds five)."""
    res = client.get("/api/categories")
    assert res.status_code == 200
    return res.json()[0]["id"]


def seller_product_body(seller_id: int, category_id: int, name: str) -> dict:
    return {
        "seller_id": seller_id,
        "category_id": category_id,
        "name": name,
        "brand": "Apex",
        "stock": 10,
        "description": "Test product description.",
        "features": ["Feature one", "Feature two"],
        "oldPrice": 120,
        "discount": 10,
        "price": 108,
    }
