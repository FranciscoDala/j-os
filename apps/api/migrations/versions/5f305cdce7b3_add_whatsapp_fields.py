"""add whatsapp fields

Revision ID: 5f305cdce7b3
Revises: 9f0890d50b42
Create Date: 2026-10-08 21:17:16.980134
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '5f305cdce7b3'
down_revision: Union[str, None] = '9f0890d50b42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('empresas', sa.Column('whatsapp_instance', sa.String(length=100), nullable=True))
    op.add_column('empresas', sa.Column('whatsapp_conectado', sa.Boolean(), nullable=False, server_default=sa.text('false')))

def downgrade() -> None:
    op.drop_column('empresas', 'whatsapp_conectado')
    op.drop_column('empresas', 'whatsapp_instance')
