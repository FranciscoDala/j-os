from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from.models import RoleEnum

class EmpresaResumo(BaseModel):
    id: UUID
    nome: Optional[str] = "Loja"
    role: RoleEnum

class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    role: RoleEnum = RoleEnum.FUNCIONARIO
    empresa_id: UUID

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class SelectEmpresaRequest(BaseModel):
    temp_token: str
    empresa_id: UUID

class UserOut(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    role: RoleEnum
    avatar_url: Optional[str] = None
    ativo: bool
    created_at: datetime
    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: Optional[str] = None
    temp_token: Optional[str] = None
    token_type: str = "bearer"
    empresas: Optional[List[EmpresaResumo]] = None
    user: UserOut
    empresa_id: Optional[str] = None # novo pra facilitar frontend
