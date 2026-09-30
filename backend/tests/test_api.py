"""
Integration tests for the ApexMart API (FastAPI TestClient + SQLite).

Test IDs (TC-xx) match the test case table in the project report.
"""

from conftest import bearer, seller_product_body

from app.database import SessionLocal
from app.models.customer import User
from app.core.security import decode_access_token


# =========================================================
# MODULE A: REGISTRATION, LOGIN AND ROLE-BASED ACCESS
# =========================================================

def test_tc01_customer_register_hashes_password(client, customer):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == customer["id"]).first()
        assert user is not None
        assert user.password != customer["password"]
        assert user.password.startswith("$argon2")
    finally:
        db.close()


def test_tc02_duplicate_customer_email_rejected(client, customer):
    res = client.post("/customer/register", json={
        "first_name": "Other",
        "last_name": "Person",
        "email": customer["email"],
        "password": "whatever1",
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_tc03_customer_login_returns_customer_jwt(client, customer):
    role, user_id = decode_access_token(customer["token"])
    assert role == "customer"
    assert user_id == customer["id"]


def test_tc04_wrong_password_rejected(client, customer):
    res = client.post("/customer/login", json={
        "email": customer["email"],
        "password": "wrong-password",
    })
    assert res.status_code == 401


def test_tc05_auth_me_with_and_without_token(client, customer):
    ok = client.get("/api/auth/me", headers=bearer(customer["token"]))
    assert ok.status_code == 200
    assert ok.json()["role"] == "customer"
    assert ok.json()["email"] == customer["email"]

    missing = client.get("/api/auth/me")
    assert missing.status_code == 401

    tampered = client.get("/api/auth/me", headers=bearer(customer["token"] + "x"))
    assert tampered.status_code == 401


def test_tc06_seller_login_returns_seller_jwt(client, seller):
    role, seller_id = decode_access_token(seller["token"])
    assert role == "seller"
    assert seller_id == seller["id"]


def test_tc07_admin_routes_need_admin_role(client, customer, seller, admin_token):
    path = "/api/admin/customers"

    assert client.get(path).status_code == 401
    assert client.get(path, headers=bearer(customer["token"])).status_code == 403
    assert client.get(path, headers=bearer(seller["token"])).status_code == 403
    assert client.get(path, headers=bearer(admin_token)).status_code == 200


def test_tc08_admin_register_is_admin_only(client, customer):
    res = client.post(
        "/api/admin/register",
        json={"username": "intruder", "email": "intruder@apexmart-demo.com", "password": "pass123"},
        headers=bearer(customer["token"]),
    )
    assert res.status_code == 403


# =========================================================
# MODULE C + D: SELLER PRODUCT SUBMISSION AND ADMIN APPROVAL
# =========================================================

def test_tc09_seller_product_starts_pending_and_hidden(client, seller, category_id):
    res = client.post(
        "/api/products/",
        json=seller_product_body(seller["id"], category_id, "Pending Phone"),
    )
    assert res.status_code == 201, res.text
    product = res.json()
    assert product["status"] == "Pending"
    assert product["added_by_role"] == "seller"

    approved = client.get("/api/products/approved").json()
    assert product["id"] not in [p["id"] for p in approved]


def test_tc10_admin_approve_makes_product_live(client, seller, category_id, admin_token):
    product = client.post(
        "/api/products/",
        json=seller_product_body(seller["id"], category_id, "Approve Me"),
    ).json()

    queue = client.get(
        "/api/admin/products?status=Pending", headers=bearer(admin_token)
    ).json()
    assert product["id"] in [p["id"] for p in queue]

    res = client.patch(
        f"/api/admin/products/{product['id']}/approve", headers=bearer(admin_token)
    )
    assert res.status_code == 200
    assert res.json()["status"] == "Approved"

    approved = client.get("/api/products/approved").json()
    assert product["id"] in [p["id"] for p in approved]


def test_tc11_admin_reject_keeps_product_hidden(client, seller, category_id, admin_token):
    product = client.post(
        "/api/products/",
        json=seller_product_body(seller["id"], category_id, "Reject Me"),
    ).json()

    res = client.patch(
        f"/api/admin/products/{product['id']}/reject", headers=bearer(admin_token)
    )
    assert res.status_code == 200
    assert res.json()["status"] == "Rejected"

    approved = client.get("/api/products/approved").json()
    assert product["id"] not in [p["id"] for p in approved]

    mine = client.get(f"/api/products/seller/{seller['id']}").json()
    statuses = {p["name"]: p["status"] for p in mine}
    assert statuses["Reject Me"] == "Rejected"


def test_tc12_product_with_unknown_category_rejected(client, seller):
    res = client.post(
        "/api/products/",
        json=seller_product_body(seller["id"], 99999, "No Category"),
    )
    assert res.status_code == 400
    assert "category" in res.json()["detail"].lower()


def test_tc13_seller_dashboard_counts(client, seller):
    res = client.get(f"/api/sellers/{seller['id']}/dashboard")
    assert res.status_code == 200
    stats = res.json()["statistics"]
    # TC-09..11 created one pending, one approved and one rejected product
    assert stats["total_products"] >= stats["live_products"] + stats["pending_products"] + 1
    assert stats["live_products"] >= 1
    assert stats["pending_products"] >= 1


# =========================================================
# MODULE D: ADMIN CATEGORY, PRODUCT AND CUSTOMER MANAGEMENT
# =========================================================

def test_tc14_admin_creates_category_and_duplicate_is_409(client, admin_token):
    res = client.post(
        "/api/admin/categories",
        json={"name": "Books & Stationery", "icon": "bi-book"},
        headers=bearer(admin_token),
    )
    assert res.status_code == 201, res.text
    assert res.json()["slug"] == "books-stationery"
    assert res.json()["icon"] == "book"

    duplicate = client.post(
        "/api/admin/categories",
        json={"name": "books & stationery"},
        headers=bearer(admin_token),
    )
    assert duplicate.status_code == 409

    public = client.get("/api/categories").json()
    assert "books-stationery" in [c["slug"] for c in public]


def test_tc15_admin_product_is_live_immediately(client, admin_token, category_id):
    res = client.post(
        "/api/admin/products",
        json={
            "category_id": category_id,
            "name": "Admin Speaker",
            "stock": 5,
            "description": "Added by the admin.",
            "price": 80,
            "old_price": 100,
        },
        headers=bearer(admin_token),
    )
    assert res.status_code == 201, res.text
    product = res.json()
    assert product["status"] == "Approved"
    assert product["added_by_role"] == "admin"
    assert product["seller_id"] is None
    assert float(product["discount"]) == 20.0

    approved = client.get("/api/products/approved").json()
    assert product["id"] in [p["id"] for p in approved]


def test_tc16_admin_product_old_price_must_exceed_price(client, admin_token, category_id):
    res = client.post(
        "/api/admin/products",
        json={
            "category_id": category_id,
            "name": "Bad Price",
            "stock": 1,
            "description": "Invalid prices.",
            "price": 100,
            "old_price": 90,
        },
        headers=bearer(admin_token),
    )
    assert res.status_code == 422


def test_tc17_admin_category_counts_and_filters(client, admin_token, category_id):
    cats = client.get("/api/admin/categories", headers=bearer(admin_token)).json()
    cat = next(c for c in cats if c["id"] == category_id)
    assert cat["product_count"] == (
        cat["approved_count"] + cat["pending_count"] + cat["declined_count"]
    )

    admin_only = client.get(
        f"/api/admin/categories/{category_id}/products?added_by=admin",
        headers=bearer(admin_token),
    ).json()
    assert admin_only and all(p["added_by_role"] == "admin" for p in admin_only)

    declined = client.get(
        f"/api/admin/categories/{category_id}/products?status=declined",
        headers=bearer(admin_token),
    ).json()
    assert all(p["status"] == "Rejected" for p in declined)


def test_tc18_admin_customer_search(client, admin_token, customer):
    hit = client.get(
        "/api/admin/customers?search=customer@apexmart", headers=bearer(admin_token)
    ).json()
    assert [c["email"] for c in hit] == [customer["email"]]
    assert "password" not in hit[0]
    assert hit[0]["last_login_at"] is not None

    miss = client.get(
        "/api/admin/customers?search=nobody-here", headers=bearer(admin_token)
    ).json()
    assert miss == []


# =========================================================
# MODULE B: CUSTOMER SHOPPING (ORDERS, REVIEWS, WISHLIST)
# =========================================================

def _approved_product_id(client):
    return client.get("/api/products/approved").json()[0]["id"]


def _place_order(client, customer, product_id):
    return client.post("/customer/orders", json={
        "user_id": customer["id"],
        "full_name": "Test Customer",
        "phone": "01800000000",
        "street_address": "12 Test Road",
        "city": "Chittagong",
        "postal_code": "4000",
        "items": [{"product_id": product_id, "quantity": 2, "unit_price": 80}],
        "subtotal": 160,
        "shipping": 0,
        "discount": 0,
        "total": 160,
    })


def test_tc19_place_order_and_list_history(client, customer):
    product_id = _approved_product_id(client)
    res = _place_order(client, customer, product_id)
    assert res.status_code == 200, res.text
    order = res.json()
    assert order["order_number"].startswith("#AM")
    assert order["status"] == "Pending"
    assert order["items"][0]["quantity"] == 2

    history = client.get(f"/customer/orders/{customer['id']}").json()
    assert order["id"] in [o["id"] for o in history]


def test_tc20_product_in_an_order_cannot_be_deleted(client):
    orders_product = _approved_product_id(client)
    res = client.delete(f"/api/products/{orders_product}")
    assert res.status_code == 409


def test_tc21_review_for_own_order_is_saved(client, customer):
    product_id = _approved_product_id(client)
    order = client.get(f"/customer/orders/{customer['id']}").json()[0]

    res = client.post("/customer/reviews", json={
        "user_id": customer["id"],
        "product_id": product_id,
        "order_id": order["id"],
        "rating": 5,
        "review": "Great product.",
    })
    assert res.status_code == 200, res.text

    reviews = client.get(f"/customer/reviews/product/{product_id}").json()
    assert "Great product." in [r["review"] for r in reviews]


def test_tc22_review_for_someone_elses_order_is_refused(client, customer):
    """Expected: a 4xx error. The endpoint returns {"detail": ...} with
    response_model=ReviewResponse, so FastAPI fails with a 500 instead."""
    product_id = _approved_product_id(client)

    res = client.post("/customer/reviews", json={
        "user_id": customer["id"],
        "product_id": product_id,
        "order_id": 999999,
        "rating": 1,
        "review": "Should not be saved.",
    })
    assert res.status_code in (400, 403, 404)


def test_tc23_wishlist_add_is_idempotent_and_removable(client, customer):
    product_id = _approved_product_id(client)
    body = {"user_id": customer["id"], "product_id": product_id}

    first = client.post("/customer/wishlist", json=body)
    second = client.post("/customer/wishlist", json=body)
    assert first.status_code == second.status_code == 200
    assert first.json()["id"] == second.json()["id"]

    items = client.get(f"/customer/wishlist/{customer['id']}").json()
    assert len([i for i in items if i["product_id"] == product_id]) == 1

    removed = client.delete(f"/customer/wishlist/{customer['id']}/{first.json()['id']}")
    assert removed.status_code == 200
    assert client.get(f"/customer/wishlist/{customer['id']}").json() == []


def test_tc24_customer_dashboard_counts(client, customer):
    res = client.get(f"/customer/dashboard/{customer['id']}")
    assert res.status_code == 200
    data = res.json()
    assert data["total_orders"] >= 1
    assert data["pending_orders"] >= 1
    assert len(data["recent_orders"]) <= 3


def test_tc25_upload_rejects_non_image_files(client):
    res = client.post(
        "/api/products/upload-image",
        files={"image": ("notes.txt", b"hello", "text/plain")},
    )
    assert res.status_code == 400
