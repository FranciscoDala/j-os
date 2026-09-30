"""venda item status + observacao cozinha

Revision ID: 33c45373c80d
Revises: 04d6d4b23688
Create Date: 2026-09-30 22:30:36.508706
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '33c45373c80d'
down_revision: Union[str, None] = '04d6d4b23688'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Cria o enum se não existir
    op.execute("DO $$ BEGIN CREATE TYPE vendaitemstatus AS ENUM ('PENDENTE','EM_PREPARO','PRONTO','ENTREGUE','CANCELADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Adiciona colunas com default pra não quebrar itens antigos
    op.add_column('venda_itens', sa.Column('status', sa.Enum('PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO', name='vendaitemstatus', create_type=False), nullable=False, server_default='PENDENTE'))
    op.add_column('venda_itens', sa.Column('observacao', sa.String(length=500), nullable=True))

    op.create_index(op.f('ix_venda_itens_empresa_id'), 'venda_itens', ['empresa_id'], unique=False)
    op.create_index(op.f('ix_venda_itens_status'), 'venda_itens', ['status'], unique=False)
    op.create_index(op.f('ix_vendas_status'), 'vendas', ['status'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_vendas_status'), table_name='vendas')
    op.drop_index(op.f('ix_venda_itens_status'), table_name='venda_itens')
    op.drop_index(op.f('ix_venda_itens_empresa_id'), table_name='venda_itens')
    op.drop_column('venda_itens', 'observacao')
    op.drop_column('venda_itens', 'status')
    # Não dropa o type pra não quebrar downgrade em cascata
