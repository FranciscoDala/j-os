import uuid
from datetime import datetime
import enum
import sqlalchemy as sa
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from jos_api.db.base import Base

class RoleEnum(str, enum.Enum):
    DONO = "dono"
    GERENTE_RESTAURANTE = "gerente_restaurante"
    OPERADOR_CAIXA = "operador_caixa"
    CAIXA = "caixa"
    GARCOM = "garcom"
    VIGILANTE = "vigilante"
    RH = "rh"
    FUNCIONARIO = "funcionario"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            low = value.lower().strip()
            for member in cls:
                if member.value == low or member.name.lower() == low:
                    return member
        return None

class UserEmpresa(Base):
    __tablename__ = "user_empresas"
    __table_args__ = (UniqueConstraint("user_id", "empresa_id", name="uq_user_empresa"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), index=True, nullable=False)
    role: Mapped[RoleEnum] = mapped_column(SAEnum(RoleEnum, name="roleenum", create_type=False), default=RoleEnum.FUNCIONARIO, nullable=False, server_default="funcionario")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, server_default=sa.func.now())

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(SAEnum(RoleEnum, name="roleenum", create_type=False), default=RoleEnum.FUNCIONARIO, nullable=False, server_default="funcionario")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, server_default=sa.func.now())
    empresas_vinculadas: Mapped[list["UserEmpresa"]] = relationship("UserEmpresa", cascade="all, delete-orphan", lazy="selectin", foreign_keys="[UserEmpresa.user_id]")

    @property
    def role_slug(self) -> str:
        r = self.role
        if isinstance(r, str): return r.lower()
        if isinstance(r, enum.Enum): return str(r.value).lower()
        return str(r).lower()
