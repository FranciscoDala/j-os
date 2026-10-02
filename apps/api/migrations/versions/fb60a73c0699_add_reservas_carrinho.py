"""add reservas_carrinho

Revision ID: fb60a73c0699
Revises: 33c45373c80d
Create Date: 2026-10-02 15:57:41.628042
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'fb60a73c0699'
down_revision: Union[str, None] = '33c45373c80d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('reservas_carrinho',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('empresa_id', sa.UUID(), nullable=False),
        sa.Column('produto_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('quantidade', sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column('expira_em', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['produto_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_reservas_carrinho_empresa_id', 'reservas_carrinho', ['empresa_id'])
    op.create_index('ix_reservas_carrinho_produto_id', 'reservas_carrinho', ['produto_id'])
    op.create_index('ix_reservas_carrinho_user_id', 'reservas_carrinho', ['user_id'])
    op.create_index('ix_reservas_carrinho_expira', 'reservas_carrinho', ['expira_em'])

def downgrade() -> None:
    op.drop_index('ix_reservas_carrinho_expira', table_name='reservas_carrinho')
    op.drop_index('ix_reservas_carrinho_user_id', table_name='reservas_carrinho')
    op.drop_index('ix_reservas_carrinho_produto_id', table_name='reservas_carrinho')
    op.drop_index('ix_reservas_carrinho_empresa_id', table_name='reservas_carrinho')
    op.drop_table('reservas_carrinho')
