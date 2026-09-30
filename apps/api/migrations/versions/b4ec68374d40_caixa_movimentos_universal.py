"""caixa movimentos universal

Revision ID: b4ec68374d40
Revises: b30adf11a3d0
Create Date: 2026-09-30 16:54:27.206478

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b4ec68374d40'
down_revision: Union[str, None] = 'b30adf11a3d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # cria tipos de forma segura - idempotente
    op.execute("DO $$ BEGIN CREATE TYPE tipomovimento AS ENUM ('VENDA','SANGRIA','SUPRIMENTO','DESPESA','ESTORNO','ABERTURA','FECHAMENTO'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE origemmovimento AS ENUM ('VENDA','MANUAL','SISTEMA'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    op.create_table('caixa_movimentos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('empresa_id', sa.UUID(), nullable=False),
        sa.Column('caixa_id', sa.UUID(), nullable=False),
        sa.Column('tipo', postgresql.ENUM('VENDA','SANGRIA','SUPRIMENTO','DESPESA','ESTORNO','ABERTURA','FECHAMENTO', name='tipomovimento', create_type=False), nullable=False),
        sa.Column('origem', postgresql.ENUM('VENDA','MANUAL','SISTEMA', name='origemmovimento', create_type=False), nullable=False, server_default='MANUAL'),
        sa.Column('valor', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('descricao', sa.String(length=255), nullable=False),
        sa.Column('venda_id', sa.UUID(), nullable=True),
        sa.Column('forma_pagamento', sa.String(length=50), nullable=True),
        sa.Column('criado_por', sa.UUID(), nullable=False),
        sa.Column('criado_por_nome', sa.String(length=150), nullable=False),
        sa.Column('criado_em', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['caixa_id'], ['caixas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['venda_id'], ['vendas.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_caixa_movimentos_caixa_id'), 'caixa_movimentos', ['caixa_id'], unique=False)
    op.create_index(op.f('ix_caixa_movimentos_empresa_id'), 'caixa_movimentos', ['empresa_id'], unique=False)
    op.create_index(op.f('ix_caixa_movimentos_venda_id'), 'caixa_movimentos', ['venda_id'], unique=False)

    # NÃO força vendas.caixa_id pra NOT NULL - deixa nullable por causa do histórico
    # Se quiser obrigar no futuro, faz depois que popular os antigos

def downgrade() -> None:
    op.drop_index(op.f('ix_caixa_movimentos_venda_id'), table_name='caixa_movimentos')
    op.drop_index(op.f('ix_caixa_movimentos_empresa_id'), table_name='caixa_movimentos')
    op.drop_index(op.f('ix_caixa_movimentos_caixa_id'), table_name='caixa_movimentos')
    op.drop_table('caixa_movimentos')
    op.execute("DROP TYPE IF EXISTS tipomovimento")
    op.execute("DROP TYPE IF EXISTS origemmovimento")
