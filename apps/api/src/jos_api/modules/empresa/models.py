import uuid
from datetime import datetime
import enum
import sqlalchemy as sa
from sqlalchemy import String, DateTime, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base
from sqlalchemy import Enum as SAEnum

class TipoEmpresaEnum(str, enum.Enum):
    VAREJO = "VAREJO"
    RESTAURANTE = "RESTAURANTE"
    SEGURANCA = "SEGURANCA"
    SERVICOS = "SERVICOS"

class Empresa(Base):
    __tablename__ = "empresas"
    __table_args__ = (
        Index("ix_empresas_nif_unique", "nif", unique=True, postgresql_where=sa.text("nif IS NOT NULL")),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome_fantasia: Mapped[str] = mapped_column(String(150), nullable=False)
    cnpj: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tipo: Mapped[TipoEmpresaEnum] = mapped_column(
        SAEnum(TipoEmpresaEnum, name="tipoempresa", create_type=False),
        nullable=False,
        server_default=TipoEmpresaEnum.VAREJO.value,
        default=TipoEmpresaEnum.VAREJO
    )

    nif: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    province: Mapped[str | None] = mapped_column(String(100), nullable=True)

    iban: Mapped[str | None] = mapped_column(String(34), nullable=True)
    iban2: Mapped[str | None] = mapped_column(String(34), nullable=True)
    banco1: Mapped[str | None] = mapped_column(String(100), nullable=True)
    banco2: Mapped[str | None] = mapped_column(String(100), nullable=True)

    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # NOVO: controle WhatsApp Evolution
    whatsapp_instance: Mapped[str | None] = mapped_column(String(100), nullable=True)
    whatsapp_conectado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    nif_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    nif_agt_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo_agt: Mapped[str | None] = mapped_column(String(50), nullable=True)
    estado_agt: Mapped[str | None] = mapped_column(String(50), nullable=True)
    inadimplente: Mapped[str | None] = mapped_column(String(20), nullable=True)
    regime_iva: Mapped[str | None] = mapped_column(String(50), nullable=True)
    residente_fiscal: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ultima_verificacao_agt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=sa.text('now()'), default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, server_default=sa.text('now()'), onupdate=datetime.utcnow, nullable=True)
