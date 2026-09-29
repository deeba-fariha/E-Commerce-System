from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pathlib import Path
from decimal import Decimal
import uuid
import shutil

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models.product import Product
from ..models.seller import Seller
from ..models import OrderItem

from ..schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)


# =========================================================
# BASIC CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent

UPLOAD_DIR = BASE_DIR / "uploads" / "products"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


# UPLOAD PRODUCT IMAGE

@router.post("/upload-image")
async def upload_product_image(
    image: UploadFile = File(...)
):
    if not image.filename:
        raise HTTPException(
            status_code=400,
            detail="No image selected."
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    }

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, WEBP, and GIF images are allowed."
        )

    extension = Path(image.filename).suffix.lower()

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    }

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file extension."
        )

    filename = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / filename

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to save uploaded image."
        )

    image_path = f"/uploads/products/{filename}"

    return {
        "message": "Image uploaded successfully.",
        "image": image_path
    }


# =========================================================
# CREATE PRODUCT
# =========================================================

@router.post(
    "/",
    response_model=ProductResponse,
    status_code=201
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Check seller
    # -----------------------------------------------------

    seller = (
        db.query(Seller)
        .filter(Seller.id == product_data.seller_id)
        .first()
    )

    if not seller:
        raise HTTPException(
            status_code=404,
            detail="Seller not found."
        )

    # -----------------------------------------------------
    # Create product
    # -----------------------------------------------------

    new_product = Product(
        # VERY IMPORTANT:
        # Save the seller ID coming from frontend
        seller_id=product_data.seller_id,

        name=product_data.name,
        category=product_data.category,
        brand=product_data.brand,

        badge=product_data.badge,
        stock=product_data.stock,

        description=product_data.description,
        features=product_data.features,

        old_price=product_data.old_price,

        discount=product_data.discount,
        price=product_data.price,

        image=product_data.image,

        rating=product_data.rating,
        reviews=product_data.reviews,

        # Newly added products start as Pending
        status="Pending",

        # Keep additional database fields synchronized
        category_name=product_data.category,
        reviews_count=product_data.reviews,
        badge_type=product_data.badge,
        in_stock=product_data.stock > 0
    )

    # -----------------------------------------------------
    # Save product
    # -----------------------------------------------------

    try:
        db.add(new_product)
        db.commit()
        db.refresh(new_product)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Failed to create product because of a database constraint."
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create product."
        )

    return new_product


# =========================================================
# GET ALL PRODUCTS
# =========================================================

@router.get(
    "/",
    response_model=list[ProductResponse]
)
def get_all_products(
    db: Session = Depends(get_db)
):

    products = (
        db.query(Product)
        .order_by(Product.id.desc())
        .all()
    )

    return products


# =========================================================
# GET PRODUCTS FOR A SELLER
# =========================================================

@router.get(
    "/seller/{seller_id}",
    response_model=list[ProductResponse]
)
def get_seller_products(
    seller_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Check seller
    # -----------------------------------------------------

    seller = (
        db.query(Seller)
        .filter(Seller.id == seller_id)
        .first()
    )

    if not seller:
        raise HTTPException(
            status_code=404,
            detail="Seller not found."
        )

    # -----------------------------------------------------
    # Get only this seller's products
    # -----------------------------------------------------

    products = (
        db.query(Product)
        .filter(Product.seller_id == seller_id)
        .order_by(Product.id.desc())
        .all()
    )

    return products







  
    
    # =========================================================
# GET APPROVED PRODUCTS FOR HOMEPAGE
# =========================================================

@router.get(
    "/approved",
    response_model=list[ProductResponse]
)
def get_approved_products(
    db: Session = Depends(get_db)
):

    products = (
        db.query(Product)
        .filter(Product.status == "Approved")
        .order_by(Product.id.desc())
        .all()
    )

    return products







# =========================================================
# GET SINGLE PRODUCT
# =========================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    return product


# =========================================================
# UPDATE PRODUCT
# =========================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find product
    # -----------------------------------------------------

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # -----------------------------------------------------
    # Get only fields actually sent by frontend
    # -----------------------------------------------------

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Update name
    # -----------------------------------------------------

    if "name" in update_data:
        product.name = update_data["name"]

    # -----------------------------------------------------
    # Update category
    # -----------------------------------------------------

    if "category" in update_data:
        product.category = update_data["category"]

        if "category_name" not in update_data:
            product.category_name = update_data["category"]

    # -----------------------------------------------------
    # Update brand
    # -----------------------------------------------------

    if "brand" in update_data:
        product.brand = update_data["brand"]

    # -----------------------------------------------------
    # Update badge
    # -----------------------------------------------------

    if "badge" in update_data:
        product.badge = update_data["badge"]

        if "badge_type" not in update_data:
            product.badge_type = update_data["badge"]

    # -----------------------------------------------------
    # Update stock
    # -----------------------------------------------------

    if "stock" in update_data:
        product.stock = update_data["stock"]
        product.in_stock = update_data["stock"] > 0

    # -----------------------------------------------------
    # Update description
    # -----------------------------------------------------

    if "description" in update_data:
        product.description = update_data["description"]

    # -----------------------------------------------------
    # Update features
    # -----------------------------------------------------

    if "features" in update_data:
        product.features = update_data["features"]

    # -----------------------------------------------------
    # Update old price
    # -----------------------------------------------------

    if "old_price" in update_data:
        product.old_price = update_data["old_price"]

    # -----------------------------------------------------
    # Update discount
    # -----------------------------------------------------

    if "discount" in update_data:
        product.discount = update_data["discount"]

    # -----------------------------------------------------
    # Update sale price
    # -----------------------------------------------------

    if "price" in update_data:
        product.price = update_data["price"]

    # -----------------------------------------------------
    # Update image
    # -----------------------------------------------------

    if "image" in update_data:
        product.image = update_data["image"]

    # -----------------------------------------------------
    # Update category_name
    # -----------------------------------------------------

    if "category_name" in update_data:
        product.category_name = update_data["category_name"]

    # -----------------------------------------------------
    # Update badge_type
    # -----------------------------------------------------

    if "badge_type" in update_data:
        product.badge_type = update_data["badge_type"]

    # -----------------------------------------------------
    # Update in_stock
    # -----------------------------------------------------

    if "in_stock" in update_data:
        product.in_stock = update_data["in_stock"]

    # -----------------------------------------------------
    # Save changes
    # -----------------------------------------------------

    try:
        db.commit()
        db.refresh(product)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Product update violates a database constraint."
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update product."
        )

    return product


# =========================================================
# DELETE PRODUCT
# =========================================================

@router.delete(
    "/{product_id}"
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find product
    # -----------------------------------------------------

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # -----------------------------------------------------
    # Check whether product is already used in an order
    # -----------------------------------------------------

    existing_order_item = (
        db.query(OrderItem)
        .filter(OrderItem.product_id == product_id)
        .first()
    )

    if existing_order_item:
        raise HTTPException(
            status_code=409,
            detail=(
                "Product cannot be deleted because it is already "
                "included in an order."
            )
        )

    # -----------------------------------------------------
    # Delete product
    # -----------------------------------------------------

    try:
        db.delete(product)
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Product cannot be deleted because it is referenced "
                "by another record."
            )
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete product."
        )

    return {
        "message": "Product deleted successfully.",
        "product_id": product_id
    }
    
    
    
    
    
  