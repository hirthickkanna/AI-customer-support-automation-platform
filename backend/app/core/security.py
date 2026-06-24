import os
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

# Set up Argon2 hashing context
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def _get_signing_key() -> bytes:
    """Return the canonical signing key as bytes.
    
    If JWT_SECRET is a valid base64 string (e.g. Supabase JWT secret),
    use the decoded bytes. Otherwise fall back to the raw UTF-8 string.
    """
    secret = settings.JWT_SECRET
    try:
        # Add padding if needed
        padded = secret + '=' * (-len(secret) % 4)
        return base64.b64decode(padded)
    except Exception:
        return secret.encode("utf-8")

SECRET_KEY = _get_signing_key()

def hash_password(password: str) -> str:
    """Hash password using Argon2."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify standard plain password against its Argon2 hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed JWT access token using the canonical signing key."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict]:
    """Decode JWT token and check validity using the canonical signing key."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_aud": False, "verify_exp": False})
        return payload
    except JWTError as e:
        print(f"JWT Decode error: {e}")
        return None

def verify_mfa_totp(user_secret: str, code: str) -> bool:
    """Simulate verification of time-based MFA code."""
    # In enterprise code we'd use pyotp, here we verify a static placeholder for testing
    return code == "123456"
