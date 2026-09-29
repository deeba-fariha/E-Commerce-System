from pydantic import BaseModel, EmailStr


class SellerCreate(BaseModel):
    store_name: str
    category: str
    email: EmailStr
    phone: str
    password: str
    revenue_tier: str = "new"


class SellerResponse(BaseModel):
    id: int
    store_name: str
    category: str
    email: EmailStr
    phone: str
    revenue_tier: str

    model_config = {
        "from_attributes": True
    }