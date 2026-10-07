"""add campos fatura empresa

Revision ID: 9f0890d50b42
Revises: 50ddf196135e
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '9f0890d50b42'
down_revision: Union[str, None] = '50ddf196135e'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('empresas', sa.Column('nif', sa.String(length=20), nullable=True))
    op.add_column('empresas', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('empresas', sa.Column('phone', sa.String(length=30), nullable=True))
    op.add_column('empresas', sa.Column('address', sa.String(length=255), nullable=True))
    op.add_column('empresas', sa.Column('city', sa.String(length=100), nullable=True))
    op.add_column('empresas', sa.Column('province', sa.String(length=100), nullable=True))
    op.add_column('empresas', sa.Column('iban', sa.String(length=34), nullable=True))
    op.add_column('empresas', sa.Column('iban2', sa.String(length=34), nullable=True))
    op.add_column('empresas', sa.Column('banco1', sa.String(length=100), nullable=True))
    op.add_column('empresas', sa.Column('banco2', sa.String(length=100), nullable=True))
    op.add_column('empresas', sa.Column('logo_url', sa.String(length=500), nullable=True))
    op.add_column('empresas', sa.Column('image_url', sa.String(length=500), nullable=True))
    op.add_column('empresas', sa.Column('nif_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('empresas', sa.Column('nif_agt_name', sa.String(length=255), nullable=True))
    op.add_column('empresas', sa.Column('tipo_agt', sa.String(length=50), nullable=True))
    op.add_column('empresas', sa.Column('estado_agt', sa.String(length=50), nullable=True))
    op.add_column('empresas', sa.Column('inadimplente', sa.String(length=20), nullable=True))
    op.add_column('empresas', sa.Column('regime_iva', sa.String(length=50), nullable=True))
    op.add_column('empresas', sa.Column('residente_fiscal', sa.String(length=20), nullable=True))
    op.add_column('empresas', sa.Column('ultima_verificacao_agt', sa.DateTime(), nullable=True))
    op.add_column('empresas', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True))
    op.create_index(op.f('ix_empresas_nif'), 'empresas', ['nif'], unique=False)
    op.create_index('ix_empresas_nif_unique', 'empresas', ['nif'], unique=True, postgresql_where=sa.text('nif IS NOT NULL'))

def downgrade() -> None:
    op.drop_index('ix_empresas_nif_unique', table_name='empresas', postgresql_where=sa.text('nif IS NOT NULL'))
    op.drop_index(op.f('ix_empresas_nif'), table_name='empresas')
    op.drop_column('empresas', 'updated_at')
    op.drop_column('empresas', 'ultima_verificacao_agt')
    op.drop_column('empresas', 'residente_fiscal')
    op.drop_column('empresas', 'regime_iva')
    op.drop_column('empresas', 'inadimplente')
    op.drop_column('empresas', 'estado_agt')
    op.drop_column('empresas', 'tipo_agt')
    op.drop_column('empresas', 'nif_agt_name')
    op.drop_column('empresas', 'nif_verified')
    op.drop_column('empresas', 'image_url')
    op.drop_column('empresas', 'logo_url')
    op.drop_column('empresas', 'banco2')
    op.drop_column('empresas', 'banco1')
    op.drop_column('empresas', 'iban2')
    op.drop_column('empresas', 'iban')
    op.drop_column('empresas', 'province')
    op.drop_column('empresas', 'city')
    op.drop_column('empresas', 'address')
    op.drop_column('empresas', 'phone')
    op.drop_column('empresas', 'email')
    op.drop_column('empresas', 'nif')
