"""fix qr mesa_numero str

Revision ID: d47908104913
Revises: e059899c2dfe
Create Date: 2026-10-05 17:32:24.354595

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd47908104913'
down_revision: Union[str, None] = 'e059899c2dfe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # int -> varchar(20)
    op.alter_column('pedidos_qr', 'mesa_numero',
               existing_type=sa.INTEGER(),
               type_=sa.String(length=20),
               existing_nullable=False,
               postgresql_using='mesa_numero::varchar')
    op.create_index(op.f('ix_pedidos_qr_mesa_numero'), 'pedidos_qr', ['mesa_numero'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_pedidos_qr_mesa_numero'), table_name='pedidos_qr')
    op.alter_column('pedidos_qr', 'mesa_numero',
               existing_type=sa.String(length=20),
               type_=sa.INTEGER(),
               existing_nullable=False,
               postgresql_using='mesa_numero::integer')
