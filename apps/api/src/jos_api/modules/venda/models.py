import uuid
from datetime import datetime
from decimal import Decimal
import enum
from sqlalchemy import String, DateTime, ForeignKey, Numeric, UniqueConstraint, Boolean
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from jos_api.db.base import Base

class VendaStatus(str, enum.Enum):
    ABERTA = "ABERTA"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"

class VendaTipo(str, enum.Enum):
    BALCAO = "BALCAO"
    MESA = "MESA"

class Venda(Base):
    __tablename__ = "vendas"
    __table_args__ = (
        UniqueConstraint('empresa_id', 'numero', name='uq_venda_empresa_numero'),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    # AGORA OBRIGATÓRIO - mas no banco deixamos nullable True até você limpar vendas antigas
    caixa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("caixas.id", ondelete="RESTRICT"), nullable=False, index=True)

    numero: Mapped[int] = mapped_column(nullable=False)
    tipo: Mapped[VendaTipo] = mapped_column(SAEnum(VendaTipo, name="vendatipo", create_type=False), default=VendaTipo.BALCAO, nullable=False)
    mesa_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("mesas.id"), nullable=True, index=True)

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0"), nullable=False)
    total_iva: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0"), nullable=False)

    dinheiro_recebido: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0"), nullable=False)
    troco: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0"), nullable=False)
    forma_pagamento: Mapped[str] = mapped_column(String(20), default="DINHEIRO", nullable=False)
    status: Mapped[VendaStatus] = mapped_column(SAEnum(VendaStatus, name="vendastatus", create_type=False), default=VendaStatus.CONCLUIDA, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    itens: Mapped[list["VendaItem"]] = relationship("VendaItem", back_populates="venda", cascade="all, delete-orphan")

class VendaItem(Base):
    __tablename__ = "venda_itens"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendas.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    produto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    nome_produto: Mapped[str] = mapped_column(String(150), nullable=False)
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12,3), nullable=False)
    preco_unit: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)

    tem_iva: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    iva_percent: Mapped[Decimal] = mapped_column(Numeric(5,2), default=Decimal("0"), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    iva_valor: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)

    venda: Mapped[Venda] = relationship("Venda", back_populates="itens")
