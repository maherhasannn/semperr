"""Auth API — register (invite-gated), login, logout. Rate-limited at main.py."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi import Request  # kept for logout signature
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import CSRF_COOKIE, SESSION_COOKIE
from app.models.user import User
from app.schemas.auth import LoginIn, RegisterIn, UserOut
from app.security import (
    hash_password,
    issue_session_token,
    needs_rehash,
    new_csrf_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookies(resp: Response, token: str, csrf: str) -> None:
    s = get_settings()
    resp.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=s.session_max_age_seconds,
        httponly=True,
        secure=(s.env == "prod"),
        samesite="lax",
        path="/",
    )
    resp.set_cookie(
        CSRF_COOKIE,
        csrf,
        max_age=s.session_max_age_seconds,
        httponly=False,  # readable for double-submit
        secure=(s.env == "prod"),
        samesite="lax",
        path="/",
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, response: Response, db: Session = Depends(get_db)) -> User:
    s = get_settings()
    if payload.invite_code != s.invite_code:
        raise HTTPException(status_code=403, detail="invalid invite code")
    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="email already registered")
    user = User(email=str(payload.email), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = issue_session_token(user.id)
    _set_session_cookies(response, token, new_csrf_token())
    return user


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)) -> User:
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if user is None or not verify_password(user.password_hash, payload.password):
        raise HTTPException(status_code=401, detail="invalid credentials")
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)
        db.commit()
    token = issue_session_token(user.id)
    _set_session_cookies(response, token, new_csrf_token())
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request) -> Response:
    resp = Response(status_code=status.HTTP_204_NO_CONTENT)
    resp.delete_cookie(SESSION_COOKIE, path="/")
    resp.delete_cookie(CSRF_COOKIE, path="/")
    return resp
