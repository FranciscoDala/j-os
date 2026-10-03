from pydantic import BaseModel, field_validator
from uuid import UUID
from typing import Optional
from datetime import date
from.models import TipoEntidadeEnum

class EntidadeCreate(BaseModel):
    tipo: TipoEntidadeEnum
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    documento: Optional[str] = None
    endereco: Optional[str] = None
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    salario: Optional[float] = None
    carga_horaria: Optional[int] = None
    data_admissao: Optional[date] = None
    empresa_fornecedora: Optional[str] = None
    categoria_fornecedor: Optional[str] = None
    tem_acesso_app: bool = False
    perfil_id: Optional[UUID] = None
    senha: Optional[str] = None

    @field_validator('salario')
    @classmethod
    def validar_salario(cls, v):
        if v is not None and v < 0:
            raise ValueError('Salário não pode ser negativo')
        return v

    @field_validator('nome')
    @classmethod
    def validar_nome(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Nome muito curto')
        return v.strip()

class EntidadeOut(BaseModel):
    id: UUID
    empresa_id: UUID
    tipo: TipoEntidadeEnum
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    documento: Optional[str] = None
    endereco: Optional[str] = None
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    salario: Optional[float] = None
    carga_horaria: Optional[int] = None
    data_admissao: Optional[date] = None
    empresa_fornecedora: Optional[str] = None
    categoria_fornecedor: Optional[str] = None
    tem_acesso_app: bool
    perfil_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    ativo: bool
    class Config:
        from_attributes = True

class PerfilOut(BaseModel):
    id: UUID
    nome: str
    slug: str
    descricao: Optional[str] = None
    class Config:
        from_attributes = True
