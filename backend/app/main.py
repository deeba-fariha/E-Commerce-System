from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .database import  engine

from .routers import (
    customer,
    sellers,
    products,
    admin_auth
)


# Create database tables



app = FastAPI(
    title="ApexMart Backend",
    version="1.0.0"
)


# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(customer.router)
app.include_router(sellers.router)
app.include_router(products.router)
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