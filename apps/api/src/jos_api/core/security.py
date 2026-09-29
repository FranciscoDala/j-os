from datetime import datetime, timedelta
from jose import jwt
import bcrypt
from jos_api.core.config import settings

def hash_password(password: str) -> str:
    pw = password[:72].encode()
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain[:72].encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_temp_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.TEMP_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "type": "temp_select", "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
