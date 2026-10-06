from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from decimal import Decimal

class ItemQrCreate(BaseModel):
    produto_id: UUID
    quantidade: Decimal
    observacao: Optional[str] = None

class PedidoQrPublicCreate(BaseModel):
    mesa_numero: str
    cliente_nome: str
    cliente_telefone: Optional[str] = None
    itens: List[ItemQrCreate]
    qr_token: Optional[str] = None

class PedidoQrResponse(BaseModel):
    id: UUID
    empresa_id: UUID
    mesa_id: Optional[UUID] = None
    mesa_numero: str
    cliente_nome: str
    cliente_telefone: Optional[str] = None
    itens: list
    total_estimado: Decimal
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class CardapioPublicResponse(BaseModel):
    empresa_nome: str
    produtos: list
    categorias: list
    mesa: Optional[dict] = None
