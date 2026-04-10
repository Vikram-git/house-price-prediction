from datetime import timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from app.auth_utils import create_access_token, verify_demo_credentials
from app.config import settings
from app.dependencies import current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
def login(body: LoginBody) -> TokenResponse:
    if not verify_demo_credentials(body.email, body.password):
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(
        {"sub": body.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return TokenResponse(access_token=token)


@router.get("/me")
def me(user: dict = Depends(current_user)) -> dict[str, str]:
    return {"email": user["sub"]}
