from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError
from jos_api.core.config import settings
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User
from sqlalchemy.orm import Session
from jos_api.db.session import get_db
from jos_api.modules.auth.models import UserEmpresa

def get_current_tenant(
    x_empresa_id: str = Header(..., alias="x-empresa-id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verifica se o user realmente pertence a essa empresa na tabela N:N
    vinculo = db.query(UserEmpresa).filter(
        UserEmpresa.user_id == current_user.id,
        UserEmpresa.empresa_id == x_empresa_id
    ).first()

    if not vinculo and str(current_user.empresa_id)!= x_empresa_id:
        raise HTTPException(status_code=403, detail="Acesso negado a essa loja")

    return {"empresa_id": x_empresa_id, "role": vinculo.role if vinculo else current_user.role}
