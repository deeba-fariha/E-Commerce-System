import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .database import engine
from .migrations import prepare_database

from .routers import (
    auth,
    customer,
    sellers,
    products,
    admin_products,
    admin_customers,
    admin_categories,
    admin_auth,
    categories
)


# Database set-up runs once at start-up, before the server accepts
# requests (not at import time): create missing tables, then add any
# new columns to existing tables (app/migrations.py). If a migration
# cannot get a table lock, start-up stops with a clear message.

@asynccontextmanager
async def lifespan(app: FastAPI):
    prepare_database(engine)
    yield


app = FastAPI(
    title="ApexMart Backend",
    version="1.0.0",
    lifespan=lifespan
)


# CORS

# Local development: any port on localhost / 127.0.0.1
# (Live Server switches between 5500, 5501, 3000, ...).
# Production: list the real site origins in CORS_ORIGINS
# (comma separated) in backend/.env.

LOCAL_ORIGIN_REGEX = r"http://(127\.0\.0\.1|localhost):\d+"

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=LOCAL_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(customer.router)
app.include_router(sellers.router)
app.include_router(products.router)
# admin_* routers must come before admin_auth, whose
# GET /api/admin/{admin_id} would otherwise catch their paths
app.include_router(admin_products.router)
app.include_router(admin_customers.router)
app.include_router(admin_categories.router)
app.include_router(admin_auth.router)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "ApexMart Backend Running"
    }
    
    
    
BASE_DIR = Path(__file__).resolve().parent.parent

app.mount(
    "/uploads",
    StaticFiles(directory=BASE_DIR / "uploads"),
    name="uploads"
)