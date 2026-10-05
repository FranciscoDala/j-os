"""add qr_token sessao

Revision ID: 50ddf196135e
Revises: d47908104913
Create Date: 2026-10-05 18:48:10.106444
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '50ddf196135e'
down_revision: Union[str, None] = 'd47908104913'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('mesas', sa.Column('qr_token', sa.String(length=20), nullable=True))
    op.add_column('mesas', sa.Column('qr_token_criado_em', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_mesas_qr_token'), 'mesas', ['qr_token'], unique=False)
    op.add_column('pedidos_qr', sa.Column('qr_token', sa.String(length=20), nullable=True))

def downgrade() -> None:
    op.drop_column('pedidos_qr', 'qr_token')
    op.drop_index(op.f('ix_mesas_qr_token'), table_name='mesas')
    op.drop_column('mesas', 'qr_token_criado_em')
    op.drop_column('mesas', 'qr_token')
