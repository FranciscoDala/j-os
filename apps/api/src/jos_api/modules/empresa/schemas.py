from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class EmpresaCreate(BaseModel):
    nome_fantasia: str
    cnpj: Optional[str] = None

class EmpresaOut(BaseModel):
    id: UUID
    nome_fantasia: str
    cnpj: Optional[str] = None

    class Config:
        from_attributes = True

class VincularUsuarioSchema(BaseModel):
    email: str
    role: str = "FUNCIONARIO"
