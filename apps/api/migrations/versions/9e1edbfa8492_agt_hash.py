"""agt hash

Revision ID: 9e1edbfa8492
Revises: 5f305cdce7b3
Create Date: 2026-10-17 09:42:18.180569

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9e1edbfa8492'
down_revision: Union[str, None] = '5f305cdce7b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('vendas', sa.Column('hash', sa.Text(), nullable=True))
    op.add_column('vendas', sa.Column('hash_anterior', sa.Text(), nullable=True))
    op.add_column('vendas', sa.Column('numero_fatura', sa.String(length=50), nullable=True))
    op.add_column('vendas', sa.Column('data_fatura', sa.DateTime(), nullable=True))
    op.create_index('ix_vendas_hash', 'vendas', ['hash'], unique=False)
    op.create_index('ix_vendas_numero_fatura', 'vendas', ['numero_fatura'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_vendas_numero_fatura', table_name='vendas')
    op.drop_index('ix_vendas_hash', table_name='vendas')
    op.drop_column('vendas', 'data_fatura')
    op.drop_column('vendas', 'numero_fatura')
    op.drop_column('vendas', 'hash_anterior')
    op.drop_column('vendas', 'hash')
