from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session


from ..database import get_db


# Customer models

from ..models.customer import (

    User,

    Order,

    OrderItem,

    Review,

    Wishlist

)


# Product model is now shared with Seller

from ..models.product import Product


# Customer schemas

from ..schemas.customer import (

    UserCreate,

    UserResponse,

    UserLogin,

    UserUpdate,

    OrderResponse,

    OrderCreate,

    ReviewCreate,

    ReviewResponse,

    WishlistCreate,

    WishlistResponse

)



router = APIRouter(

    prefix="/customer",

    tags=["Customer"]

)



# =========================================================
# CUSTOMER REGISTRATION
# =========================================================

@router.post(

    "/register",

    response_model=UserResponse

)

def register_user(

    user: UserCreate,

    db: Session = Depends(get_db)

):

    new_user = User(

        first_name=user.first_name,

        last_name=user.last_name,

        email=user.email,

        password=user.password

    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    return new_user



# =========================================================
# CUSTOMER LOGIN
# =========================================================

@router.post(

    "/login",

    response_model=UserResponse

)

def login_user(

    user: UserLogin,

    db: Session = Depends(get_db)

):

    existing_user = (

        db.query(User)

        .filter(User.email == user.email)

        .first()

    )


    if not existing_user:

        return {

            "detail": "Invalid email or password"

        }


    if existing_user.password != user.password:

        return {

            "detail": "Invalid email or password"

        }


    return existing_user



# =========================================================
# GET CUSTOMER PROFILE
# =========================================================

@router.get(

    "/profile/{user_id}",

    response_model=UserResponse

)

def get_profile(

    user_id: int,

    db: Session = Depends(get_db)

):

    user = (

        db.query(User)

        .filter(User.id == user_id)

        .first()

    )


    if not user:

        return {

            "detail": "User not found"

        }


    return user



# =========================================================
# UPDATE CUSTOMER PROFILE
# =========================================================

@router.put(

    "/profile/{user_id}",

    response_model=UserResponse

)

def update_profile(

    user_id: int,

    user: UserUpdate,

    db: Session = Depends(get_db)

):

    existing_user = (

        db.query(User)

        .filter(User.id == user_id)

        .first()

    )


    if not existing_user:

        return {

            "detail": "User not found"

        }


    existing_user.first_name = user.first_name

    existing_user.last_name = user.last_name

    existing_user.email = user.email


    if user.password:

        existing_user.password = user.password


    db.commit()

    db.refresh(existing_user)


    return existing_user



# =========================================================
# GET CUSTOMER ORDERS
# =========================================================

@router.get(

    "/orders/{user_id}",

    response_model=list[OrderResponse]

)

def get_customer_orders(

    user_id: int,

    db: Session = Depends(get_db)

):

    orders = (

        db.query(Order)

        .filter(Order.user_id == user_id)

        .order_by(Order.id.desc())

        .all()

    )


    result = []


    for order in orders:


        items = (

            db.query(OrderItem)

            .filter(OrderItem.order_id == order.id)

            .all()

        )


        order_data = {

            "id": order.id,

            "order_number": order.order_number,

            "user_id": order.user_id,


            "full_name": order.full_name,

            "phone": order.phone,

            "street_address": order.street_address,

            "city": order.city,

            "postal_code": order.postal_code,

            "order_note": order.order_note,


            "subtotal": order.subtotal,

            "shipping": order.shipping,

            "discount": order.discount,

            "total": order.total,

            "status": order.status,


            "items": [

                {

                    "id": item.id,

                    "product_id": item.product_id,

                    "product_name": (

                        db.query(Product)

                        .filter(Product.id == item.product_id)

                        .first()

                        .name

                    ),

                    "quantity": item.quantity,

                    "unit_price": item.unit_price

                }

                for item in items

            ]

        }


        result.append(order_data)


    return result



# =========================================================
# GET ORDERS FOR SELLER
# =========================================================

@router.get("/seller-orders/{seller_id}")

def get_seller_orders(

    seller_id: int,

    db: Session = Depends(get_db)

):

    rows = (

        db.query(

            OrderItem,

            Order,

            Product

        )

        .join(

            Order,

            Order.id == OrderItem.order_id

        )

        .join(

            Product,

            Product.id == OrderItem.product_id

        )

        .filter(

            Product.seller_id == seller_id

        )

        .order_by(

            Order.id.desc()

        )

        .all()

    )


    result = []


    for item, order, product in rows:


        result.append({

            "order_id": order.id,

            "order_number": order.order_number,

            "customer_id": order.user_id,

            "customer_name": order.full_name,

            "product_id": product.id,

            "product_name": product.name,

            "quantity": item.quantity,

            "unit_price": item.unit_price,

            "total_amount":

                float(item.unit_price) *

                int(item.quantity),

            "status": order.status

        })


    return result



# =========================================================
# CREATE CUSTOMER ORDER
# =========================================================

@router.post(

    "/orders",

    response_model=OrderResponse

)

def create_customer_order(

    order_data: OrderCreate,

    db: Session = Depends(get_db)

):

    # Check user

    user = (

        db.query(User)

        .filter(User.id == order_data.user_id)

        .first()

    )


    if not user:

        return {

            "detail": "User not found"

        }


    # Generate order number

    last_order = (

        db.query(Order)

        .order_by(Order.id.desc())

        .first()

    )


    if last_order:

        next_id = last_order.id + 1

    else:

        next_id = 1


    order_number = f"#AM{10244 + next_id}"


    # Create order

    new_order = Order(

        order_number=order_number,

        user_id=order_data.user_id,


        full_name=order_data.full_name,

        phone=order_data.phone,

        street_address=order_data.street_address,

        city=order_data.city,

        postal_code=order_data.postal_code,

        order_note=order_data.order_note,


        subtotal=order_data.subtotal,

        shipping=order_data.shipping,

        discount=order_data.discount,

        total=order_data.total,

        status="Pending"

    )


    db.add(new_order)

    db.commit()

    db.refresh(new_order)


    # Create order items

    for item in order_data.items:


        product = (

            db.query(Product)

            .filter(Product.id == item.product_id)

            .first()

        )


        if not product:

            continue


        new_item = OrderItem(

            order_id=new_order.id,

            product_id=product.id,

            quantity=item.quantity,

            unit_price=item.unit_price

        )


        db.add(new_item)


    db.commit()

    db.refresh(new_order)


    return {

        "id": new_order.id,

        "order_number": new_order.order_number,

        "user_id": new_order.user_id,


        "full_name": new_order.full_name,

        "phone": new_order.phone,

        "street_address": new_order.street_address,

        "city": new_order.city,

        "postal_code": new_order.postal_code,

        "order_note": new_order.order_note,


        "subtotal": new_order.subtotal,

        "shipping": new_order.shipping,

        "discount": new_order.discount,

        "total": new_order.total,

        "status": new_order.status,


        "items": [

            {

                "id": item.id,

                "product_id": item.product_id,

                "product_name": (

                    db.query(Product)

                    .filter(Product.id == item.product_id)

                    .first()

                    .name

                ),

                "quantity": item.quantity,

                "unit_price": item.unit_price

            }

            for item in (

                db.query(OrderItem)

                .filter(OrderItem.order_id == new_order.id)

                .all()

            )

        ]

    }



# =========================================================
# CREATE PRODUCT REVIEW
# =========================================================

@router.post(

    "/reviews",

    response_model=ReviewResponse

)

def create_review(

    review_data: ReviewCreate,

    db: Session = Depends(get_db)

):

    # Check user

    user = (

        db.query(User)

        .filter(User.id == review_data.user_id)

        .first()

    )


    if not user:

        return {

            "detail": "User not found"

        }


    # Check product

    product = (

        db.query(Product)

        .filter(Product.id == review_data.product_id)

        .first()

    )


    if not product:

        return {

            "detail": "Product not found"

        }


    # Check order

    order = (

        db.query(Order)

        .filter(

            Order.id == review_data.order_id,

            Order.user_id == review_data.user_id

        )

        .first()

    )


    if not order:

        return {

            "detail": "Order not found"

        }


    # Create review

    new_review = Review(

        user_id=review_data.user_id,

        product_id=review_data.product_id,

        order_id=review_data.order_id,

        rating=review_data.rating,

        review=review_data.review

    )


    db.add(new_review)

    db.commit()

    db.refresh(new_review)


    return new_review



# =========================================================
# GET PRODUCT REVIEWS
# =========================================================

@router.get(

    "/reviews/product/{product_id}",

    response_model=list[ReviewResponse]

)

def get_product_reviews(

    product_id: int,

    db: Session = Depends(get_db)

):

    reviews = (

        db.query(Review)

        .filter(Review.product_id == product_id)

        .order_by(Review.id.desc())

        .all()

    )


    return reviews



# =========================================================
# ADD PRODUCT TO WISHLIST
# =========================================================

@router.post(

    "/wishlist",

    response_model=WishlistResponse

)

def add_to_wishlist(

    wishlist_data: WishlistCreate,

    db: Session = Depends(get_db)

):

    # Check user

    user = (

        db.query(User)

        .filter(User.id == wishlist_data.user_id)

        .first()

    )


    if not user:

        return {

            "detail": "User not found"

        }


    # Check product

    product = (

        db.query(Product)

        .filter(Product.id == wishlist_data.product_id)

        .first()

    )


    if not product:

        return {

            "detail": "Product not found"

        }


    # Check if already in wishlist

    existing_item = (

        db.query(Wishlist)

        .filter(

            Wishlist.user_id == wishlist_data.user_id,

            Wishlist.product_id == wishlist_data.product_id

        )

        .first()

    )


    if existing_item:


        product = (

            db.query(Product)

            .filter(Product.id == existing_item.product_id)

            .first()

        )


        return {

            "id": existing_item.id,

            "user_id": existing_item.user_id,

            "product_id": product.id,


            "product_name": product.name,

            "category": product.category,

            "category_name": product.category_name,


            "price": product.price,

            "old_price": product.old_price,


            "rating": product.rating,

            "reviews_count": product.reviews_count,


            "image": product.image,


            "badge": product.badge,

            "badge_type": product.badge_type

        }


    # Create wishlist item

    new_wishlist = Wishlist(

        user_id=wishlist_data.user_id,

        product_id=wishlist_data.product_id

    )


    db.add(new_wishlist)

    db.commit()

    db.refresh(new_wishlist)


    return {

        "id": new_wishlist.id,

        "user_id": new_wishlist.user_id,

        "product_id": product.id,


        "product_name": product.name,

        "category": product.category,

        "category_name": product.category_name,


        "price": product.price,

        "old_price": product.old_price,


        "rating": product.rating,

        "reviews_count": product.reviews_count,


        "image": product.image,


        "badge": product.badge,

        "badge_type": product.badge_type

    }



# =========================================================
# DELETE PRODUCT FROM WISHLIST
# =========================================================

@router.delete(

    "/wishlist/{user_id}/{wishlist_id}"

)

def delete_from_wishlist(

    user_id: int,

    wishlist_id: int,

    db: Session = Depends(get_db)

):

    # Check wishlist item

    wishlist_item = (

        db.query(Wishlist)

        .filter(

            Wishlist.id == wishlist_id,

            Wishlist.user_id == user_id

        )

        .first()

    )


    if not wishlist_item:

        return {

            "detail": "Wishlist item not found"

        }


    # Delete wishlist item

    db.delete(wishlist_item)

    db.commit()


    return {

        "message": "Wishlist item removed successfully"

    }



# =========================================================
# GET CUSTOMER WISHLIST
# =========================================================

@router.get(

    "/wishlist/{user_id}",

    response_model=list[WishlistResponse]

)

def get_customer_wishlist(

    user_id: int,

    db: Session = Depends(get_db)

):

    wishlist_items = (

        db.query(Wishlist)

        .filter(Wishlist.user_id == user_id)

        .order_by(Wishlist.id.desc())

        .all()

    )


    result = []


    for item in wishlist_items:


        product = (

            db.query(Product)

            .filter(Product.id == item.product_id)

            .first()

        )


        if not product:

            continue


        result.append({

            "id": item.id,

            "user_id": item.user_id,

            "product_id": product.id,


            "product_name": product.name,

            "category": product.category,

            "category_name": product.category_name,


            "price": product.price,

            "old_price": product.old_price,


            "rating": product.rating,

            "reviews_count": product.reviews_count,


            "image": product.image,


            "badge": product.badge,

            "badge_type": product.badge_type

        })


    return result



# =========================================================
# CUSTOMER DASHBOARD
# =========================================================

@router.get(

    "/dashboard/{user_id}"

)

def get_customer_dashboard(

    user_id: int,

    db: Session = Depends(get_db)

):

    # Total orders

    total_orders = (

        db.query(Order)

        .filter(Order.user_id == user_id)

        .count()

    )


    # Pending orders

    pending_orders = (

        db.query(Order)

        .filter(

            Order.user_id == user_id,

            Order.status == "Pending"

        )

        .count()

    )


    # Wishlist items

    wishlist_items = (

        db.query(Wishlist)

        .filter(Wishlist.user_id == user_id)

        .count()

    )


    # Recent orders

    recent_orders = (

        db.query(Order)

        .filter(Order.user_id == user_id)

        .order_by(Order.id.desc())

        .limit(3)

        .all()

    )


    return {

        "total_orders": total_orders,

        "pending_orders": pending_orders,

        "wishlist_items": wishlist_items,


        "recent_orders": [

            {

                "id": order.id,

                "order_number": order.order_number,

                "total": order.total,

                "status": order.status

            }

            for order in recent_orders

        ]

    }