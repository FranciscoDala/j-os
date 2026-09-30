"""atividade_log universal com nome

Revision ID: 04d6d4b23688
Revises: 3c00e38d3f85
Create Date: 2026-09-30 17:42:34.589670

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '04d6d4b23688'
down_revision: Union[str, None] = '3c00e38d3f85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('atividade_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('empresa_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('user_nome', sa.String(length=150), server_default='Sistema', nullable=False),
        sa.Column('modulo', sa.String(length=50), nullable=False),
        sa.Column('acao', sa.String(length=50), nullable=False),
        sa.Column('entidade', sa.String(length=50), nullable=True),
        sa.Column('entidade_id', sa.UUID(), nullable=True),
        sa.Column('entidade_nome', sa.String(length=300), nullable=True),
        sa.Column('descricao', sa.String(length=500), nullable=False),
        sa.Column('detalhes', sa.JSON(), nullable=True),
        sa.Column('ip', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_atividade_empresa_created', 'atividade_logs', ['empresa_id', 'created_at'])
    op.create_index('ix_atividade_empresa_modulo', 'atividade_logs', ['empresa_id', 'modulo'])
    op.create_index(op.f('ix_atividade_logs_created_at'), 'atividade_logs', ['created_at'])
    op.create_index(op.f('ix_atividade_logs_empresa_id'), 'atividade_logs', ['empresa_id'])
    op.create_index(op.f('ix_atividade_logs_entidade_id'), 'atividade_logs', ['entidade_id'])
    op.create_index(op.f('ix_atividade_logs_user_id'), 'atividade_logs', ['user_id'])

def downgrade() -> None:
    op.drop_index(op.f('ix_atividade_logs_user_id'), table_name='atividade_logs')
    op.drop_index(op.f('ix_atividade_logs_entidade_id'), table_name='atividade_logs')
    op.drop_index(op.f('ix_atividade_logs_empresa_id'), table_name='atividade_logs')
    op.drop_index(op.f('ix_atividade_logs_created_at'), table_name='atividade_logs')
    op.drop_index('ix_atividade_empresa_modulo', table_name='atividade_logs')
    op.drop_index('ix_atividade_empresa_created', table_name='atividade_logs')
    op.drop_table('atividade_logs')
