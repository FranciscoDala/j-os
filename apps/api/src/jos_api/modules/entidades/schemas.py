from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from.models import TipoEntidadeEnum

class EntidadeCreate(BaseModel):
    tipo: TipoEntidadeEnum
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    documento: Optional[str] = None
    tem_acesso_app: bool = False
    perfil_id: Optional[UUID] = None
    senha: Optional[str] = None # só se tem_acesso_app = True

class EntidadeOut(BaseModel):
    id: UUID
    empresa_id: UUID
    tipo: TipoEntidadeEnum
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    tem_acesso_app: bool
    perfil_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    ativo: bool

    class Config:
        from_attributes = True
