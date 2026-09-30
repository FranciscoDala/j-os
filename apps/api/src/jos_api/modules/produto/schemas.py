from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from decimal import Decimal
from.models import ProductType, ProductUnit

class ProdutoCreateRequest(BaseModel):
    nome: str
    codigo: str
    preco_venda: Decimal
    tipo: ProductType = ProductType.GENERAL
    unidade: ProductUnit = ProductUnit.UNIT
    ativo: bool = True
    controlar_stock: bool = True
    stock_atual: Decimal = Decimal("0")
    stock_minimo: Decimal = Decimal("0")
    preco_custo: Decimal = Decimal("0")
    codigo_barras: Optional[str] = None
    codigo_qr: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    iva: Decimal = Decimal("0")
    tem_iva: bool = False
    peso: Optional[float] = None
    imagem_url: Optional[str] = None
    prep_time: Optional[int] = None
    kitchen_station: Optional[str] = None
    is_modifiable: bool = False
    service_duration: Optional[int] = None
    metadata_json: Optional[Any] = None

class ProdutoUpdateRequest(BaseModel):
    nome: Optional[str] = None
    codigo: Optional[str] = None
    preco_venda: Optional[Decimal] = None
    tipo: Optional[ProductType] = None
    ativo: Optional[bool] = None
    controlar_stock: Optional[bool] = None
    stock_atual: Optional[Decimal] = None
    codigo_barras: Optional[str] = None
    codigo_qr: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    iva: Optional[Decimal] = None
    tem_iva: Optional[bool] = None
    imagem_url: Optional[str] = None
    metadata_json: Optional[Any] = None

class ProdutoResponse(BaseModel):
    id: UUID
    empresa_id: UUID
    nome: str
    codigo: str
    codigo_barras: Optional[str] = None
    codigo_qr: Optional[str] = None
    tipo: ProductType
    preco_venda: Decimal
    stock_atual: Decimal
    controlar_stock: bool
    ativo: bool
    categoria: Optional[str] = None
    imagem_url: Optional[str] = None
    tem_iva: bool
    iva: Decimal
    created_at: datetime
    class Config:
        from_attributes = True

class BaixaStockRequest(BaseModel):
    quantidade: Decimal
