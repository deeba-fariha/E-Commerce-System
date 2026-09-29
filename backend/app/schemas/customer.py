from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str | None = None


class UserProfileResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr

    class Config:
        from_attributes = True


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    order_number: str
    user_id: int

    full_name: str
    phone: str
    street_address: str
    city: str
    postal_code: str
    order_note: str | None = None

    subtotal: float
    shipping: float
    discount: float
    total: float
    status: str

    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class OrderCreate(BaseModel):
    user_id: int

    full_name: str
    phone: str
    street_address: str
    city: str
    postal_code: str
    order_note: str | None = None

    items: list[OrderItemCreate]

    subtotal: float
    shipping: float
    discount: float
    total: float


# =========================
# REVIEW SCHEMAS
# =========================

class ReviewCreate(BaseModel):
    user_id: int
    product_id: int
    order_id: int
    rating: int
    review: str


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    order_id: int
    rating: int
    review: str

    class Config:
        from_attributes = True
        


# =========================
# WISHLIST SCHEMAS
# =========================

class WishlistCreate(BaseModel):
    user_id: int
    product_id: int


class WishlistResponse(BaseModel):
    id: int
    user_id: int
    product_id: int

    product_name: str
    category: str | None = None
    category_name: str | None = None

    price: float | None = None
    old_price: float | None = None

    rating: float | None = None
    reviews_count: int | None = None

    image: str | None = None

    badge: str | None = None
    badge_type: str | None = None

    class Config:
        from_attributes = True