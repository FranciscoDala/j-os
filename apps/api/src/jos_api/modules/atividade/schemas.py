from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class AtividadeLogResponse(BaseModel):
    id: UUID
    empresa_id: UUID
    user_id: Optional[UUID] = None
    user_nome: str
    modulo: str
    acao: str
    entidade: Optional[str] = None
    entidade_id: Optional[UUID] = None
    entidade_nome: Optional[str] = None
    descricao: str
    detalhes: Optional[dict] = None
    ip: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
