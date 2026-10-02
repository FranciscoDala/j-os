from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

class CaixaAbrirRequest(BaseModel):
    saldo_inicial: Decimal = Decimal("0")

class CaixaForcarAberturaRequest(BaseModel):
    saldo_inicial: Decimal = Decimal("0")
    motivo: str

class CaixaResponse(BaseModel):
    id: UUID
    empresa_id: UUID
    aberto_por: UUID
    aberto_por_nome: str
    status: str
    saldo_inicial: Decimal
    saldo_final_esperado: Optional[Decimal] = None
    saldo_final_informado: Optional[Decimal] = None
    divergencia: Optional[Decimal] = None
    motivo_fechamento: Optional[str] = None
    observacao: Optional[str] = None
    fechado_por: Optional[UUID] = None
    fechado_por_nome: Optional[str] = None
    aberto_em: datetime
    fechado_em: Optional[datetime] = None
    class Config:
        from_attributes = True

class CaixaMovimentoResponse(BaseModel):
    id: UUID
    caixa_id: UUID
    tipo: str
    origem: str
    valor: Decimal
    descricao: str
    venda_id: Optional[UUID] = None
    forma_pagamento: Optional[str] = None
    criado_por_nome: str
    criado_em: datetime
    class Config:
        from_attributes = True

class ExtratoResponse(BaseModel):
    caixa_id: UUID
    saldo_inicial: Decimal
    saldo_atual: Decimal
    total_entradas: Decimal
    total_saidas: Decimal
    movimentos: List[CaixaMovimentoResponse]
    # extras para periodo
    qtd_caixas: Optional[int] = 1
    periodo_inicio: Optional[str] = None
    periodo_fim: Optional[str] = None
