import uuid
from datetime import datetime
import enum
from sqlalchemy import String, DateTime, ForeignKey, Numeric, JSON
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class PedidoQrStatus(str, enum.Enum):
    AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO"
    ACEITO = "ACEITO"
    RECUSADO = "RECUSADO"

class PedidoQr(Base):
    __tablename__ = "pedidos_qr"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    mesa_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("mesas.id"), nullable=True, index=True)
    mesa_numero: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    cliente_nome: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    itens: Mapped[list] = mapped_column(JSON, nullable=False)
    total_estimado: Mapped[float] = mapped_column(Numeric(12,2), default=0, nullable=False)
    status: Mapped[PedidoQrStatus] = mapped_column(SAEnum(PedidoQrStatus, name="pedidoqrstatus", create_type=False), default=PedidoQrStatus.AGUARDANDO_APROVACAO, nullable=False, index=True)
    origem: Mapped[str] = mapped_column(String(20), default="QR_MESA", nullable=False)
    venda_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("vendas.id"), nullable=True)
    qr_token: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ip_cliente: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    aprovado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
