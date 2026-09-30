from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, min_length=6)


class AdminResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse
