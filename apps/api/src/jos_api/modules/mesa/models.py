import uuid
from datetime import datetime
import enum
import sqlalchemy as sa
from sqlalchemy import String, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class MesaStatus(str, enum.Enum):
    LIVRE = "LIVRE"
    OCUPADA = "OCUPADA"
    RESERVADA = "RESERVADA"
    SUJA = "SUJA"
    BLOQUEADA = "BLOQUEADA"

class ReservaStatus(str, enum.Enum):
    PENDENTE = "PENDENTE"
    CHECKIN = "CHECKIN"
    CANCELADA = "CANCELADA"
    EXPIRADA = "EXPIRADA"

class Mesa(Base):
    __tablename__ = "mesas"
    __table_args__ = (sa.UniqueConstraint('empresa_id', 'numero', name='uq_mesa_empresa_numero'),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    numero: Mapped[str] = mapped_column(String(20), nullable=False)
    capacidade: Mapped[int] = mapped_column(Integer, default=4, nullable=False, server_default="4")
    zona: Mapped[str] = mapped_column(String(50), default="Salão", nullable=False, server_default="Salão")
    status: Mapped[MesaStatus] = mapped_column(SAEnum(MesaStatus, name="mesastatus"), default=MesaStatus.LIVRE, nullable=False, server_default="LIVRE")
    venda_atual_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    garcom_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    aberta_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pessoas_atual: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    pos_x: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    pos_y: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))
    # NOVO - TOKEN POR SESSÃO
    qr_token: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    qr_token_criado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, server_default=sa.func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, server_default=sa.func.now())

class MesaReserva(Base):
    __tablename__ = "mesa_reservas"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    mesa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mesas.id", ondelete="CASCADE"), index=True, nullable=False)
    cliente_nome: Mapped[str] = mapped_column(String(120), nullable=False)
    cliente_telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    pessoas: Mapped[int] = mapped_column(Integer, default=2, server_default="2")
    data_reserva: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[ReservaStatus] = mapped_column(SAEnum(ReservaStatus, name="reservastatus"), default=ReservaStatus.PENDENTE, nullable=False, server_default="PENDENTE")
    venda_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, server_default=sa.func.now())
