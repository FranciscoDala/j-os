import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import String, DateTime, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class AtividadeLog(Base):
    __tablename__ = "atividade_logs"
    __table_args__ = (
        Index("ix_atividade_empresa_created", "empresa_id", "created_at"),
        Index("ix_atividade_empresa_modulo", "empresa_id", "modulo"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    user_nome: Mapped[str] = mapped_column(String(150), default="Sistema", nullable=False, server_default="Sistema")
    modulo: Mapped[str] = mapped_column(String(50), nullable=False)
    acao: Mapped[str] = mapped_column(String(50), nullable=False)
    entidade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entidade_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    entidade_nome: Mapped[str | None] = mapped_column(String(300), nullable=True)
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    detalhes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, server_default=sa.func.now(), index=True)
