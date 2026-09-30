"""add products

Revision ID: fc674bc0909d
Revises: a8683c27c3f3
Create Date: 2026-09-30 12:25:04.050596

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fc674bc0909d'
down_revision: Union[str, None] = 'a8683c27c3f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('products',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('empresa_id', sa.UUID(), nullable=False),
    sa.Column('created_by', sa.UUID(), nullable=True),
    sa.Column('nome', sa.String(length=150), nullable=False),
    sa.Column('codigo', sa.String(length=50), nullable=False),
    sa.Column('codigo_barras', sa.String(length=50), nullable=True),
    sa.Column('codigo_qr', sa.String(length=100), nullable=True),
    sa.Column('descricao', sa.Text(), nullable=True),
    sa.Column('categoria', sa.String(length=50), nullable=True),
    sa.Column('imagem_url', sa.String(length=500), nullable=True),
    sa.Column('tipo', sa.Enum('GENERAL', 'RESTAURANT_DISH', 'RESTAURANT_INGREDIENT', 'RESTAURANT_DRINK', 'SERVICE', 'KIT', name='producttype'), nullable=False),
    sa.Column('unidade', sa.Enum('UNIT', 'KG', 'LITER', 'HOUR', 'DAY', 'TASK', 'PORTION', 'UN', name='productunit'), nullable=False),
    sa.Column('preco_venda', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('preco_custo', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('peso', sa.Float(), nullable=True),
    sa.Column('iva', sa.Numeric(precision=5, scale=2), nullable=False),
    sa.Column('tem_iva', sa.Boolean(), nullable=False),
    sa.Column('ativo', sa.Boolean(), nullable=False),
    sa.Column('controlar_stock', sa.Boolean(), nullable=False),
    sa.Column('allow_negative', sa.Boolean(), nullable=False),
    sa.Column('stock_atual', sa.Numeric(precision=12, scale=3), nullable=False),
    sa.Column('stock_minimo', sa.Numeric(precision=12, scale=3), nullable=False),
    sa.Column('prep_time', sa.Integer(), nullable=True),
    sa.Column('kitchen_station', sa.String(length=30), nullable=True),
    sa.Column('is_modifiable', sa.Boolean(), nullable=False),
    sa.Column('service_duration', sa.Integer(), nullable=True),
    sa.Column('requires_booking', sa.Boolean(), nullable=False),
    sa.Column('requires_staff', sa.Boolean(), nullable=False),
    sa.Column('metadata_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('empresa_id', 'codigo', name='uq_produto_codigo_empresa'),
    sa.UniqueConstraint('empresa_id', 'codigo_barras', name='uq_produto_barcode_empresa'),
    sa.UniqueConstraint('empresa_id', 'codigo_qr', name='uq_produto_qr_empresa')
    )
    op.create_index(op.f('ix_products_categoria'), 'products', ['categoria'], unique=False)
    op.create_index(op.f('ix_products_empresa_id'), 'products', ['empresa_id'], unique=False)
    op.create_index('ix_products_empresa_tipo', 'products', ['empresa_id', 'tipo'], unique=False)
    op.create_index(op.f('ix_products_nome'), 'products', ['nome'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_products_nome'), table_name='products')
    op.drop_index('ix_products_empresa_tipo', table_name='products')
    op.drop_index(op.f('ix_products_empresa_id'), table_name='products')
    op.drop_index(op.f('ix_products_categoria'), table_name='products')
    op.drop_table('products')
