from typing import Generator
import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # Read JWT token from cookie or Authorization header (fallback)
    token = request.cookies.get("access_token")
    
    if not token:
        # Fallback: check Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return user
