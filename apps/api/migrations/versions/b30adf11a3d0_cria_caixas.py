"""cria caixas

Revision ID: b30adf11a3d0
Revises: 3ccf9630dcf3
Create Date: 2026-09-30 16:19:51.226314

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b30adf11a3d0'
down_revision: Union[str, None] = '3ccf9630dcf3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # cria o enum com IF NOT EXISTS pra nunca quebrar
    op.execute("DO $$ BEGIN CREATE TYPE caixastatus AS ENUM ('ABERTO', 'FECHADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    op.create_table('caixas',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('empresa_id', sa.UUID(), nullable=False),
        sa.Column('aberto_por', sa.UUID(), nullable=False),
        sa.Column('aberto_por_nome', sa.String(length=150), nullable=False, server_default=""),
        sa.Column('status', postgresql.ENUM('ABERTO', 'FECHADO', name='caixastatus', create_type=False), nullable=False),
        sa.Column('saldo_inicial', sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.Column('saldo_final_esperado', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('saldo_final_informado', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('divergencia', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('fechado_por', sa.UUID(), nullable=True),
        sa.Column('fechado_por_nome', sa.String(length=150), nullable=True),
        sa.Column('motivo_fechamento', sa.String(length=50), nullable=True),
        sa.Column('observacao', sa.Text(), nullable=True),
        sa.Column('aberto_em', sa.DateTime(), nullable=False),
        sa.Column('fechado_em', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_caixas_empresa_id'), 'caixas', ['empresa_id'], unique=False)

    op.add_column('vendas', sa.Column('caixa_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_vendas_caixa_id'), 'vendas', ['caixa_id'], unique=False)
    op.create_foreign_key('fk_vendas_caixa_id', 'vendas', 'caixas', ['caixa_id'], ['id'])

def downgrade() -> None:
    op.drop_constraint('fk_vendas_caixa_id', 'vendas', type_='foreignkey')
    op.drop_index(op.f('ix_vendas_caixa_id'), table_name='vendas')
    op.drop_column('vendas', 'caixa_id')
    op.drop_index(op.f('ix_caixas_empresa_id'), table_name='caixas')
    op.drop_table('caixas')
    op.execute("DROP TYPE IF EXISTS caixastatus")
