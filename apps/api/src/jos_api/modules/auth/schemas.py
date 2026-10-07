from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from.models import RoleEnum

class EmpresaResumo(BaseModel):
    id: UUID
    nome: Optional[str] = "Loja"
    nome_fantasia: Optional[str] = None
    nif: Optional[str] = None
    role: RoleEnum
    logo_url: Optional[str] = None

class EmpresaCompleta(BaseModel):
    id: UUID
    nome_fantasia: str
    cnpj: Optional[str] = None
    tipo: Optional[str] = None
    nif: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    iban: Optional[str] = None
    iban2: Optional[str] = None
    banco1: Optional[str] = None
    banco2: Optional[str] = None
    logo_url: Optional[str] = None
    image_url: Optional[str] = None
    nif_verified: bool = False
    nif_agt_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

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
    empresa_id: UUID
    temp_token: Optional[str] = None

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
    empresa: Optional[EmpresaCompleta] = None # <-- todas as infos
    user: UserOut
    empresa_id: Optional[str] = None
