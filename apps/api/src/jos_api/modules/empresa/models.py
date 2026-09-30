import uuid
from datetime import datetime
import enum
import sqlalchemy as sa
from sqlalchemy import String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class TipoEmpresaEnum(str, enum.Enum):
    VAREJO = "VAREJO"
    RESTAURANTE = "RESTAURANTE"
    SEGURANCA = "SEGURANCA"
    SERVICOS = "SERVICOS"

class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome_fantasia: Mapped[str] = mapped_column(String(150), nullable=False)
    cnpj: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # NOVO - essencial para os perfis dinâmicos
    tipo: Mapped[TipoEmpresaEnum] = mapped_column(
        Enum(TipoEmpresaEnum, name="tipoempresa"),
        nullable=False,
        server_default=TipoEmpresaEnum.VAREJO.value,
        default=TipoEmpresaEnum.VAREJO
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=sa.text('now()'),
        default=datetime.utcnow
    )
