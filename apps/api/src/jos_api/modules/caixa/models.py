import uuid
from datetime import datetime, timezone
from decimal import Decimal
import enum
from sqlalchemy import String, DateTime, Numeric, Text, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class CaixaStatus(str, enum.Enum):
    ABERTO = "ABERTO"
    FECHADO = "FECHADO"

class MotivoFechamento(str, enum.Enum):
    NORMAL = "NORMAL"
    FORCADO_TROCA_TURNO = "FORCADO_TROCA_TURNO"

class Caixa(Base):
    __tablename__ = "caixas"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    aberto_por: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    aberto_por_nome: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    status: Mapped[CaixaStatus] = mapped_column(SAEnum(CaixaStatus, name="caixastatus", create_type=False), default=CaixaStatus.ABERTO, nullable=False)
    saldo_inicial: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0"), nullable=False)
    saldo_final_esperado: Mapped[Decimal | None] = mapped_column(Numeric(12,2), nullable=True)
    saldo_final_informado: Mapped[Decimal | None] = mapped_column(Numeric(12,2), nullable=True)
    divergencia: Mapped[Decimal | None] = mapped_column(Numeric(12,2), nullable=True)
    fechado_por: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    fechado_por_nome: Mapped[str | None] = mapped_column(String(150), nullable=True)
    motivo_fechamento: Mapped[str | None] = mapped_column(String(50), nullable=True, default=MotivoFechamento.NORMAL.value)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    aberto_em: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    fechado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class TipoMovimento(str, enum.Enum):
    VENDA = "VENDA"
    SANGRIA = "SANGRIA"
    SUPRIMENTO = "SUPRIMENTO"
    DESPESA = "DESPESA"
    ESTORNO = "ESTORNO"
    ABERTURA = "ABERTURA"
    FECHAMENTO = "FECHAMENTO"

class OrigemMovimento(str, enum.Enum):
    VENDA = "VENDA"
    MANUAL = "MANUAL"
    SISTEMA = "SISTEMA"

class CaixaMovimento(Base):
    __tablename__ = "caixa_movimentos"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    caixa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("caixas.id", ondelete="CASCADE"), index=True, nullable=False)
    tipo: Mapped[TipoMovimento] = mapped_column(SAEnum(TipoMovimento, name="tipomovimento", create_type=False), nullable=False)
    origem: Mapped[OrigemMovimento] = mapped_column(SAEnum(OrigemMovimento, name="origemmovimento", create_type=False), default=OrigemMovimento.MANUAL, nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    descricao: Mapped[str] = mapped_column(String(255), nullable=False)
    venda_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("vendas.id", ondelete="SET NULL"), nullable=True, index=True)
    forma_pagamento: Mapped[str | None] = mapped_column(String(50), nullable=True)
    criado_por: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    criado_por_nome: Mapped[str] = mapped_column(String(150), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
