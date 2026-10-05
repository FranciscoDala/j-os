"""add pedidos_qr

Revision ID: e059899c2dfe
Revises: 15badce70333
Create Date: 2026-10-05 16:48:57.219695

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e059899c2dfe'
down_revision: Union[str, None] = '15badce70333'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("CREATE TYPE pedidoqrstatus AS ENUM ('AGUARDANDO_APROVACAO', 'ACEITO', 'RECUSADO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE')")

    op.create_table('pedidos_qr',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('empresa_id', sa.UUID(), nullable=False),
        sa.Column('mesa_id', sa.UUID(), nullable=True),
        sa.Column('mesa_numero', sa.Integer(), nullable=False),
        sa.Column('cliente_nome', sa.String(length=100), nullable=False),
        sa.Column('cliente_telefone', sa.String(length=20), nullable=True),
        sa.Column('itens', sa.JSON(), nullable=False),
        sa.Column('total_estimado', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.Enum('AGUARDANDO_APROVACAO', 'ACEITO', 'RECUSADO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', name='pedidoqrstatus', create_type=False), nullable=False),
        sa.Column('origem', sa.String(length=20), nullable=False, server_default='QR_MESA'),
        sa.Column('venda_id', sa.UUID(), nullable=True),
        sa.Column('ip_cliente', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('aprovado_em', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['mesa_id'], ['mesas.id']),
        sa.ForeignKeyConstraint(['venda_id'], ['vendas.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pedidos_qr_empresa_id'), 'pedidos_qr', ['empresa_id'], unique=False)
    op.create_index(op.f('ix_pedidos_qr_mesa_id'), 'pedidos_qr', ['mesa_id'], unique=False)
    op.create_index(op.f('ix_pedidos_qr_status'), 'pedidos_qr', ['status'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_pedidos_qr_status'), table_name='pedidos_qr')
    op.drop_index(op.f('ix_pedidos_qr_mesa_id'), table_name='pedidos_qr')
    op.drop_index(op.f('ix_pedidos_qr_empresa_id'), table_name='pedidos_qr')
    op.drop_table('pedidos_qr')
    op.execute("DROP TYPE pedidoqrstatus")
