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

    @field_validator('nome')
    @classmethod
    def validar_nome(cls, v):
        v = (v or "").strip()
        if len(v) < 2:
            raise ValueError('Nome muito curto')
        return v

    @field_validator('telefone', 'email', 'documento', 'endereco', 'cargo', 'departamento', 'empresa_fornecedora', 'categoria_fornecedor', 'senha', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v is None: return None
        if isinstance(v, str):
            s = v.strip()
            return s if s!= "" else None
        return v

class EntidadeOut(BaseModel):
    id: UUID
    empresa_id: UUID
    tipo: TipoEntidadeEnum
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    salario: Optional[float] = None
    tem_acesso_app: bool
    perfil_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    ativo: bool
    class Config:
        from_attributes = True
        extra = "ignore"

class PerfilOut(BaseModel):
    id: UUID
    nome: str
    slug: str
    role_equivalente: Optional[str] = None
    class Config:
        from_attributes = True
        extra = "ignore"
