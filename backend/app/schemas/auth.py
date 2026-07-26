from datetime import datetime
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
        
class Token(BaseModel):
    access_token: str
    token_type: str
