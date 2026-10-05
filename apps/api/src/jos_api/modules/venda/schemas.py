from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from decimal import Decimal

class VendaItemCreate(BaseModel):
    produto_id: UUID
    quantidade: Decimal
    observacao: Optional[str] = None

class VendaCreateRequest(BaseModel):
    itens: List[VendaItemCreate]
    mesa_id: Optional[UUID] = None
    garcom_id: Optional[UUID] = None
    pessoas: int = 1
    observacao: Optional[str] = None
    dinheiro_recebido: Decimal = Decimal("0")
    forma_pagamento: str = "DINHEIRO"

class AddItemRequest(BaseModel):
    produto_id: UUID
    quantidade: Decimal
    observacao: Optional[str] = None

class TransferirMesaRequest(BaseModel):
    nova_mesa_id: UUID

class UpdateItemStatusRequest(BaseModel):
    status: str

class ReservaRequest(BaseModel):
    produto_id: UUID
    quantidade: Decimal

class VendaItemResponse(BaseModel):
    id: UUID
    produto_id: UUID
    nome_produto: str
    quantidade: Decimal
    preco_unit: Decimal
    tem_iva: bool
    iva_percent: Decimal
    subtotal: Decimal
    iva_valor: Decimal
    total: Decimal
    status: str
    observacao: Optional[str] = None
    class Config: from_attributes = True

class VendaResponse(BaseModel):
    id: UUID
    empresa_id: UUID
    caixa_id: UUID
    numero: int
    tipo: str
    mesa_id: Optional[UUID] = None
    garcom_id: Optional[UUID] = None
    pessoas: int
    observacao: Optional[str] = None
    subtotal: Decimal
    total_iva: Decimal
    total: Decimal
    dinheiro_recebido: Decimal
    troco: Decimal
    forma_pagamento: str
    status: str
    created_at: datetime
    itens: List[VendaItemResponse]
    class Config: from_attributes = True

class ReservaResponse(BaseModel):
    id: UUID
    produto_id: UUID
    quantidade: Decimal
    expira_em: datetime
    class Config: from_attributes = True
