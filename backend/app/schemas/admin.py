from pydantic import BaseModel, EmailStr


class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True