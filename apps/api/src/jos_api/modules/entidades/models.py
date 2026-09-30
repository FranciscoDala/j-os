import uuid
from datetime import datetime
import enum
import sqlalchemy as sa
from sqlalchemy import String, DateTime, Enum as SAEnum, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class TipoEntidadeEnum(str, enum.Enum):
    CLIENTE = "CLIENTE"
    FUNCIONARIO = "FUNCIONARIO"
    FORNECEDOR = "FORNECEDOR"

class Entidade(Base):
    __tablename__ = "entidades"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)

    # corrigido pra não quebrar alembic de novo
    tipo: Mapped[TipoEntidadeEnum] = mapped_column(SAEnum(TipoEntidadeEnum, name="tipoentidade", create_type=False), nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    documento: Mapped[str | None] = mapped_column(String(30), nullable=True)

    tem_acesso_app: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    perfil_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("perfis.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=sa.text('now()'), nullable=False)
