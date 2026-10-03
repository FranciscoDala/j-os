import uuid
from datetime import datetime, date
import enum
import sqlalchemy as sa
from sqlalchemy import String, DateTime, Date, Enum as SAEnum, Boolean, ForeignKey, Numeric, Integer
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

    tipo: Mapped[TipoEntidadeEnum] = mapped_column(SAEnum(TipoEntidadeEnum, name="tipoentidade", create_type=False), nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    documento: Mapped[str | None] = mapped_column(String(30), nullable=True) # NIF/BI
    endereco: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # --- CAMPOS ESPECÍFICOS FUNCIONÁRIO ---
    cargo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    departamento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    salario: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    carga_horaria: Mapped[int | None] = mapped_column(Integer, nullable=True) # ex: 40h semanal
    data_admissao: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_demissao: Mapped[date | None] = mapped_column(Date, nullable=True)

    # --- CAMPOS ESPECÍFICOS FORNECEDOR ---
    empresa_fornecedora: Mapped[str | None] = mapped_column(String(150), nullable=True)
    categoria_fornecedor: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- ACESSO APP ---
    tem_acesso_app: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    perfil_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("perfis.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=sa.text('now()'), nullable=False)
