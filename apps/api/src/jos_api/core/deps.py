from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from jos_api.db.session import get_db
from jos_api.modules.auth.models import User
from jos_api.core.config import settings

security = HTTPBearer()

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = creds.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    if not user.ativo:
        raise HTTPException(status_code=403, detail="Usuário desativado")
    return user

def require_role(role: str):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role.value != role and current_user.role.value != "DONO":
            raise HTTPException(status_code=403, detail="Sem permissão")
        return current_user
    return checker
