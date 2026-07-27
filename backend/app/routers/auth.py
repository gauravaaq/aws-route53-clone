from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, UserOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=UserOut, summary="Authenticate user and set cookie")
def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    token = create_access_token(subject=user.id)
    
    # Set HTTP-only cookie
    # Secure=True in production, but set to False here to allow demo HTTP public IP VM deployments
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=1800,  # 30 minutes
        expires=1800,
        samesite="lax",
        secure=False,
        path="/"
    )
    
    return user

@router.post("/logout", status_code=status.HTTP_200_OK, summary="Clear authentication session")
def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        samesite="lax",
        secure=False
    )
    return {"detail": "Successfully logged out"}

@router.get("/me", response_model=UserOut, summary="Get current user details")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
