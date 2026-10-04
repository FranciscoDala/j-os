import uuid
from datetime import datetime
import enum
import sqlalchemy as sa
from sqlalchemy import String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base
from jos_api.modules.auth.models import RoleEnum

class Perfil(Base):
    __tablename__ = "perfis"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)

    nome: Mapped[str] = mapped_column(String(60), nullable=False)
    slug: Mapped[str] = mapped_column(String(60), nullable=False) # dono, caixa, garcom - único por empresa
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)

    # CORREÇÃO PROFISSIONAL - Liga Perfil ao RoleEnum antigo
    role_equivalente: Mapped[RoleEnum] = mapped_column(
        sa.Enum(RoleEnum, name="roleenum", create_type=False),
        nullable=False,
        default=RoleEnum.FUNCIONARIO,
        server_default="funcionario"
    )

    # Estrutura nova: {"modulos": [...], "acoes": [...], "all": bool}
    permissoes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=sa.text('now()'), nullable=False)

    __table_args__ = (
        sa.UniqueConstraint("empresa_id", "slug", name="uq_perfil_empresa_slug"),
    )
