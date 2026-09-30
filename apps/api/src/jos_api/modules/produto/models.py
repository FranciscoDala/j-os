import uuid
from datetime import datetime
from decimal import Decimal
import enum
import sqlalchemy as sa
from sqlalchemy import String, Boolean, DateTime, Text, Float, UniqueConstraint, Index, Enum as SAEnum, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from jos_api.db.base import Base

class ProductType(str, enum.Enum):
    GENERAL = "GENERAL"
    RESTAURANT_DISH = "RESTAURANT_DISH"
    RESTAURANT_INGREDIENT = "RESTAURANT_INGREDIENT"
    RESTAURANT_DRINK = "RESTAURANT_DRINK"
    SERVICE = "SERVICE"
    KIT = "KIT"

class ProductUnit(str, enum.Enum):
    UNIT = "UNIT"; KG = "KG"; LITER = "LITER"; HOUR = "HOUR"; DAY = "DAY"; TASK = "TASK"; PORTION = "PORTION"; UN = "UN"

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("empresa_id", "codigo", name="uq_produto_codigo_empresa"),
        UniqueConstraint("empresa_id", "codigo_barras", name="uq_produto_barcode_empresa"),
        UniqueConstraint("empresa_id", "codigo_qr", name="uq_produto_qr_empresa"),
        Index("ix_products_empresa_tipo", "empresa_id", "tipo"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    codigo_barras: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    codigo_qr: Mapped[str | None] = mapped_column(String(100), nullable=True, default=None)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    imagem_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tipo: Mapped[ProductType] = mapped_column(SAEnum(ProductType, name="producttype", create_type=False), default=ProductType.GENERAL, nullable=False, server_default="GENERAL")
    unidade: Mapped[ProductUnit] = mapped_column(SAEnum(ProductUnit, name="productunit", create_type=False), default=ProductUnit.UNIT, nullable=False, server_default="UNIT")
    preco_venda: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    preco_custo: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0"), nullable=False, server_default="0")
    peso: Mapped[float | None] = mapped_column(Float, nullable=True)
    iva: Mapped[Decimal] = mapped_column(Numeric(5,2), default=Decimal("0"), nullable=False, server_default="0")
    tem_iva: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default=sa.text('false'))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))
    controlar_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))
    allow_negative: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default=sa.text('false'))
    stock_atual: Mapped[Decimal] = mapped_column(Numeric(12,3), default=Decimal("0"), nullable=False, server_default="0")
    stock_minimo: Mapped[Decimal] = mapped_column(Numeric(12,3), default=Decimal("0"), nullable=False, server_default="0")
    prep_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    kitchen_station: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_modifiable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default=sa.text('false'))
    service_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    requires_booking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default=sa.text('false'))
    requires_staff: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default=sa.text('false'))
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, server_default=sa.func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, server_default=sa.func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
