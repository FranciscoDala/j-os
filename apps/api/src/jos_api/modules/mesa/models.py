import uuid
from datetime import datetime
import enum
import sqlalchemy as sa
from sqlalchemy import String, DateTime, Boolean, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class MesaStatus(str, enum.Enum):
    LIVRE = "LIVRE"
    OCUPADA = "OCUPADA"
    RESERVADA = "RESERVADA"

class Mesa(Base):
    __tablename__ = "mesas"
    __table_args__ = (UniqueConstraint('empresa_id', 'numero', name='uq_mesa_empresa_numero'),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    numero: Mapped[str] = mapped_column(String(20), nullable=False)
    capacidade: Mapped[int] = mapped_column(sa.Integer, default=4, nullable=False, server_default="4")
    status: Mapped[MesaStatus] = mapped_column(SAEnum(MesaStatus, name="mesastatus", create_type=False), default=MesaStatus.LIVRE, nullable=False, server_default="LIVRE")
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, server_default=sa.func.now())
