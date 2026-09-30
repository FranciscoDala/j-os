from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from.models import TipoEmpresaEnum

class EmpresaCreate(BaseModel):
    nome_fantasia: str
    cnpj: Optional[str] = None
    tipo: TipoEmpresaEnum = TipoEmpresaEnum.VAREJO

class EmpresaOut(BaseModel):
    id: UUID
    nome_fantasia: str
    cnpj: Optional[str] = None
    tipo: TipoEmpresaEnum

    class Config:
        from_attributes = True

class VincularUsuarioSchema(BaseModel):
    email: str
    role: str = "FUNCIONARIO"
