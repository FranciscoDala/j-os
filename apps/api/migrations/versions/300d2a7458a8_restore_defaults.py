"""restore defaults

Revision ID: 300d2a7458a8
Revises: fb60a73c0699
Create Date: 2026-10-02 15:59:49.649906

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '300d2a7458a8'
down_revision: Union[str, None] = 'fb60a73c0699'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.alter_column('caixa_movimentos', 'origem',
        existing_type=postgresql.ENUM('VENDA', 'MANUAL', 'SISTEMA', name='origemmovimento'),
        server_default=sa.text("'MANUAL'::origemmovimento"),
        existing_nullable=False)
    op.alter_column('caixa_movimentos', 'criado_em',
        existing_type=sa.TIMESTAMP(),
        server_default=sa.text('now()'),
        existing_nullable=False)
    op.alter_column('caixas', 'aberto_por_nome',
        existing_type=sa.VARCHAR(length=150),
        server_default=sa.text("''::character varying"),
        existing_nullable=False)
    op.alter_column('caixas', 'saldo_inicial',
        existing_type=sa.NUMERIC(precision=12, scale=2),
        server_default=sa.text("'0'::numeric"),
        existing_nullable=False)
    op.alter_column('venda_itens', 'status',
        existing_type=postgresql.ENUM('PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO', name='vendaitemstatus'),
        server_default=sa.text("'PENDENTE'::vendaitemstatus"),
        existing_nullable=False)

def downgrade() -> None:
    pass
