"""mesa reserva link

Revision ID: 15badce70333
Revises: 0ff90b5bbad9
Create Date: 2026-10-05 10:50:11.355094
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '15badce70333'
down_revision: Union[str, None] = '0ff90b5bbad9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Adiciona novos valores no enum mesastatus - precisa antes do alter
    op.execute("ALTER TYPE mesastatus ADD VALUE IF NOT EXISTS 'SUJA'")
    op.execute("ALTER TYPE mesastatus ADD VALUE IF NOT EXISTS 'BLOQUEADA'")

    op.create_table('mesa_reservas',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('empresa_id', sa.UUID(), nullable=False),
        sa.Column('mesa_id', sa.UUID(), nullable=False),
        sa.Column('cliente_nome', sa.String(length=120), nullable=False),
        sa.Column('cliente_telefone', sa.String(length=30), nullable=True),
        sa.Column('pessoas', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('data_reserva', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('PENDENTE', 'CHECKIN', 'CANCELADA', 'EXPIRADA', name='reservastatus'), server_default='PENDENTE', nullable=False),
        sa.Column('venda_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['mesa_id'], ['mesas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mesa_reservas_empresa_id'), 'mesa_reservas', ['empresa_id'], unique=False)
    op.create_index(op.f('ix_mesa_reservas_mesa_id'), 'mesa_reservas', ['mesa_id'], unique=False)

    # mesas - novos campos
    op.add_column('mesas', sa.Column('zona', sa.String(length=50), server_default='Salão', nullable=False))
    op.add_column('mesas', sa.Column('venda_atual_id', sa.UUID(), nullable=True))
    op.add_column('mesas', sa.Column('garcom_id', sa.UUID(), nullable=True))
    op.add_column('mesas', sa.Column('aberta_em', sa.DateTime(), nullable=True))
    op.add_column('mesas', sa.Column('pessoas_atual', sa.Integer(), server_default='0', nullable=False))
    op.add_column('mesas', sa.Column('pos_x', sa.Integer(), server_default='0', nullable=False))
    op.add_column('mesas', sa.Column('pos_y', sa.Integer(), server_default='0', nullable=False))
    op.add_column('mesas', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False))

    # vendas - novos campos
    op.add_column('vendas', sa.Column('garcom_id', sa.UUID(), nullable=True))
    op.add_column('vendas', sa.Column('pessoas', sa.Integer(), server_default='1', nullable=False))
    op.add_column('vendas', sa.Column('observacao', sa.Text(), nullable=True))
    op.create_index(op.f('ix_vendas_garcom_id'), 'vendas', ['garcom_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_vendas_garcom_id'), table_name='vendas')
    op.drop_column('vendas', 'observacao')
    op.drop_column('vendas', 'pessoas')
    op.drop_column('vendas', 'garcom_id')

    op.drop_column('mesas', 'updated_at')
    op.drop_column('mesas', 'pos_y')
    op.drop_column('mesas', 'pos_x')
    op.drop_column('mesas', 'pessoas_atual')
    op.drop_column('mesas', 'aberta_em')
    op.drop_column('mesas', 'garcom_id')
    op.drop_column('mesas', 'venda_atual_id')
    op.drop_column('mesas', 'zona')

    op.drop_index(op.f('ix_mesa_reservas_mesa_id'), table_name='mesa_reservas')
    op.drop_index(op.f('ix_mesa_reservas_empresa_id'), table_name='mesa_reservas')
    op.drop_table('mesa_reservas')
    op.execute("DROP TYPE reservastatus")
