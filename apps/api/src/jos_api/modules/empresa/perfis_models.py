import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class Perfil(Base):
    __tablename__ = "perfis"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)

    nome: Mapped[str] = mapped_column(String(60), nullable=False) # DONO, GARÇOM, AGENTE
    slug: Mapped[str] = mapped_column(String(60), nullable=False) # dono, garcom
    is_system: Mapped[bool] = mapped_column(Boolean, default=True) # criado pelo sistema
    permissoes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict) # {"pode_ver_caixa": true, "app": ["mesas", "pedidos"]}

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=sa.text('now()'), nullable=False)
