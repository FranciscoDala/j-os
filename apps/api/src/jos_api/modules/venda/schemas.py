from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from decimal import Decimal

class VendaItemCreate(BaseModel):
    produto_id: UUID
    quantidade: Decimal

class VendaCreateRequest(BaseModel):
    itens: List[VendaItemCreate]
    mesa_id: Optional[UUID] = None
    dinheiro_recebido: Decimal = Decimal("0")
    forma_pagamento: str = "DINHEIRO"

class MesaCreateRequest(BaseModel):
    numero: str
    capacidade: int = 4

class MesaResponse(BaseModel):
    id: UUID
    numero: str
    capacidade: int
    status: str
    class Config:
        from_attributes = True

class VendaItemResponse(BaseModel):
    produto_id: UUID
    nome_produto: str
    quantidade: Decimal
    preco_unit: Decimal
    tem_iva: bool
    iva_percent: Decimal
    subtotal: Decimal
    iva_valor: Decimal
    total: Decimal
    class Config:
        from_attributes = True

class VendaResponse(BaseModel):
    id: UUID
    empresa_id: UUID
    numero: int
    tipo: str
    mesa_id: Optional[UUID] = None
    subtotal: Decimal
    total_iva: Decimal
    total: Decimal
    dinheiro_recebido: Decimal
    troco: Decimal
    forma_pagamento: str
    status: str
    created_at: datetime
    itens: List[VendaItemResponse]
    class Config:
        from_attributes = True
