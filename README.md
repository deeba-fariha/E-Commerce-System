# ApexMart — Multi-Vendor E-Commerce Platform

A full-stack, multi-vendor marketplace where **customers** shop, **sellers** manage their own stores, and **admins** moderate the platform.



## 📌 About the Project

**ApexMart** is a university group project that implements a complete multi-vendor e-commerce workflow: product listing and approval, shopping cart and checkout, order tracking, reviews, wishlists, and role-specific dashboards for customers, sellers, and administrators.

The project is split into two parts:

- **Backend** — a REST API built with **FastAPI**, **SQLAlchemy**, and **PostgreSQL**.
- **Frontend** — a lightweight multi-page site built with **HTML, CSS, and vanilla JavaScript** that talks to the API via `fetch`.

---

## ✨ Key Features

### 👤 Customer
- Register / log in and manage profile
- Browse and view approved products with details, ratings, and reviews
- Shopping cart (persisted in the browser)
- Checkout with **Stripe (test mode)** card payments or **Cash on Delivery**
- Order history and order tracking
- Wishlist (add / remove / view)
- Leave ratings and reviews on purchased products
- Personal dashboard

### 🏪 Seller
- Seller registration and login
- Seller dashboard with sales and product statistics
- Add, edit, and delete products, including **image upload**
- Track product approval status (`Pending` → approved/rejected)
- View orders that contain their products
- Manage store profile

### 🛡️ Admin

* Admin registration and login (passwords hashed with Argon2)
* Admin dashboard with overview of website activities
* Add, edit, and delete product categories
* Add new products and manage product information
* View, edit, and remove existing products
* Review and manage seller accounts
* Review and approve seller product submissions
* View and manage customer list
* View customer details and account status
* View and manage orders
* Track order status and order details
* Manage payment records and transaction information
* Review and manage customer reviews and ratings
* Monitor sellers, products, customers, orders, and payments
* Activate, deactivate, or remove sellers and customers when necessary

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Backend framework** | FastAPI, Uvicorn |
| **Database** | PostgreSQL via `psycopg` (v3) |
| **ORM & validation** | SQLAlchemy 2.x, Pydantic v2 |
| **Password hashing** | `pwdlib` with Argon2 |
| **File uploads** | `python-multipart`, FastAPI `StaticFiles` |
| **Configuration** | `python-dotenv` |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Payments** | Stripe.js (test mode) |

---

## 📁 Project Structure

```
E-Commerce-System/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration, static uploads
│   │   ├── database.py          # Engine, session, Base, get_db dependency
│   │   ├── models/              # SQLAlchemy models (User, Order, Product, Seller, Admin…)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # customer, sellers, products, admin_auth
│   │   └── core/                # config, security, dependencies (placeholders)
│   ├── uploads/                 # Uploaded product images (git-ignored)
│   └── requirements.txt
│
├── main/                        # Storefront: home page & product detail
├── account/                     # Customer & seller login / registration
├── customer/                    # Dashboard, orders, wishlist, profile, checkout
├── seller/                      # Seller dashboard, products, orders, profile
├── Payment Gateway/             # Checkout & payment flow (Stripe test / COD)
├── Admin Panel/                 # Admin UI (login, dashboard, management modules)
├── css/                         # Shared stylesheets
├── js/                          # Shared frontend scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **PostgreSQL 14+**
- A static file server for the frontend, e.g. the VS Code **Live Server** extension (the API's CORS is configured for port `5500`)
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/E-Commerce-System.git
cd E-Commerce-System
```

### 2. Set up the database

```sql
CREATE DATABASE apexmart;
```

### 3. Set up the backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apexmart
DB_USER=postgres
DB_PASSWORD=your_password
```

Create the folder used for product image uploads (it is git-ignored, and the app will fail to start without it):

```bash
mkdir uploads
```

> **⚠️ Creating the tables:** the current code does not call `Base.metadata.create_all()` automatically. Run this once from the `backend/` folder to create the schema:
>
> ```bash
> python -c "from app.database import Base, engine; from app import models; from app.models import admin, seller, product; Base.metadata.create_all(bind=engine)"
> ```

### 4. Run the API

From the `backend/` folder:

```bash
uvicorn app.main:app --reload
```

- API base URL: <http://127.0.0.1:8000>
- Interactive docs (Swagger UI): <http://127.0.0.1:8000/docs>
- Alternative docs (ReDoc): <http://127.0.0.1:8000/redoc>

### 5. Run the frontend

Open the project root in VS Code and start **Live Server** on port **5500**, then visit:

| Area | URL |
|---|---|
| Storefront | `http://127.0.0.1:5500/main/index.html` |
| Customer login | `http://127.0.0.1:5500/account/login.html` |
| Seller login | `http://127.0.0.1:5500/account/seller-login.html` |
| Admin panel | `http://127.0.0.1:5500/Admin%20Panel/login.html` |

### 6. Create an admin account

There is no default admin. Create one through the API (Swagger UI at `/docs` works well):

```bash
curl -X POST http://127.0.0.1:8000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "email": "admin@example.com", "password": "ChangeMe123!"}'
```

> Check `backend/app/schemas/admin.py` for the exact required fields.

---

## 🔌 API Reference

All endpoints are documented interactively at `/docs`. Summary:

### Customer — `/customer`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/customer/register` | Register a new customer |
| `POST` | `/customer/login` | Customer login |
| `GET` | `/customer/profile/{user_id}` | Get profile |
| `PUT` | `/customer/profile/{user_id}` | Update profile |
| `GET` | `/customer/dashboard/{user_id}` | Dashboard summary |
| `POST` | `/customer/orders` | Place an order |
| `GET` | `/customer/orders/{user_id}` | Customer's order history |
| `GET` | `/customer/seller-orders/{seller_id}` | Orders containing a seller's products |
| `POST` | `/customer/reviews` | Submit a product review |
| `GET` | `/customer/reviews/product/{product_id}` | Reviews for a product |
| `POST` | `/customer/wishlist` | Add product to wishlist |
| `GET` | `/customer/wishlist/{user_id}` | Get wishlist |
| `DELETE` | `/customer/wishlist/{user_id}/{wishlist_id}` | Remove from wishlist |

### Sellers — `/api/sellers`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sellers/register` | Register a seller |
| `POST` | `/api/sellers/login` | Seller login |
| `GET` | `/api/sellers/{seller_id}` | Seller profile |
| `PUT` | `/api/sellers/{seller_id}` | Update seller profile |
| `GET` | `/api/sellers/{seller_id}/dashboard` | Seller dashboard stats |

### Products — `/api/products`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products/upload-image` | Upload a product image |
| `POST` | `/api/products/` | Create a product |
| `GET` | `/api/products/` | List all products |
| `GET` | `/api/products/approved` | List approved products (storefront) |
| `GET` | `/api/products/seller/{seller_id}` | List a seller's products |
| `GET` | `/api/products/{product_id}` | Get product details |
| `PUT` | `/api/products/{product_id}` | Update a product |
| `DELETE` | `/api/products/{product_id}` | Delete a product |

### Admin — `/api/admin`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/register` | Create an admin account |
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/api/admin/{admin_id}` | Get admin details |

---

## 🗄️ Database Schema

| Table | Purpose | Key fields |
|---|---|---|
| `users` | Customers | first/last name, email, password |
| `sellers` | Store owners | store_name, category, email, phone, password_hash, revenue_tier |
| `admins` | Administrators | username, email, password_hash |
| `products` | Catalog | seller_id, name, category, brand, price, old_price, discount, stock, image, rating, status |
| `orders` | Customer orders | order_number, user_id, shipping details, subtotal, shipping, discount, total, status |
| `order_items` | Line items | order_id, product_id, quantity, unit_price |
| `reviews` | Product reviews | user_id, product_id, order_id, rating, review |
| `wishlist` | Saved products | user_id, product_id |

Products and orders both default to a `Pending` status.

---

## 🖥️ Application Pages

| Folder | Pages |
|---|---|
| `main/` | `index.html`, `product.html` |
| `account/` | `login.html`, `register.html`, `seller-login.html`, `seller_form.html` |
| `customer/` | `dashboard.html`, `orders.html`, `wishlist.html`, `profile.html`, `checkout.html` |
| `seller/` | `seller-dashboard.html`, `add-product.html`, `my-products.html`, `product-status.html`, `orders.html`, `profile.html` |
| `Payment Gateway/` | `checkout.html` (Stripe test / Cash on Delivery) |
| `Admin Panel/` | `login.html`, `index.html` (categories, sellers, products, orders, customers, payments) |

---

## ⚠️ Known Limitations & Roadmap

This is an academic project, and a few things are intentionally simple. Before any production use:

- [ ] **Authentication:** login currently returns user data without issuing a token. Add JWT/session auth and protect routes (`core/security.py` and `core/dependencies.py` are empty placeholders).
- [ ] **Authorization:** enforce role checks so customers, sellers, and admins can only access their own resources.
- [ ] **Migrations:** add Alembic instead of manual table creation.
- [ ] **Admin panel data:** parts of the admin UI (`Admin Panel/js/data.js`) use mock data; connect all modules to the API.
- [ ] **Configuration:** move the hard-coded API URL (`http://127.0.0.1:8000`) and CORS origins into environment variables.
- [ ] **Payments:** the Stripe integration is client-side and in test mode; add server-side PaymentIntents and webhooks.
- [ ] **Password hashing consistency:** verify that customer passwords are hashed the same way as seller/admin passwords.
- [ ] Add automated tests and CI.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request



## 📄 License

This project is for educational purposes. Add a license of your choice (e.g. [MIT](https://choosealicense.com/licenses/mit/)) by creating a `LICENSE` file.
