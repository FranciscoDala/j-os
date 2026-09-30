"""add perfis e entidades universal

Revision ID: 3ccf9630dcf3
Revises: d01d0d23d43a
Create Date: 2026-09-30 15:24:24.432940

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '3ccf9630dcf3'
down_revision: Union[str, None] = 'd01d0d23d43a'
branch_labels = None
depends_on = None

def upgrade() -> None:
    tipoentidade = postgresql.ENUM('CLIENTE', 'FUNCIONARIO', 'FORNECEDOR', name='tipoentidade')
    tipoentidade.create(op.get_bind(), checkfirst=True)

    op.create_table('perfis',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('empresa_id', sa.UUID(), nullable=False),
    sa.Column('nome', sa.String(length=60), nullable=False),
    sa.Column('slug', sa.String(length=60), nullable=False),
    sa.Column('is_system', sa.Boolean(), nullable=False),
    sa.Column('permissoes', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('entidades',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('empresa_id', sa.UUID(), nullable=False),
    # AQUI O SEGREDO: create_type=False pra não tentar criar de novo
    sa.Column('tipo', sa.Enum('CLIENTE', 'FUNCIONARIO', 'FORNECEDOR', name='tipoentidade', create_type=False), nullable=False),
    sa.Column('nome', sa.String(length=150), nullable=False),
    sa.Column('telefone', sa.String(length=30), nullable=True),
    sa.Column('email', sa.String(length=150), nullable=True),
    sa.Column('documento', sa.String(length=30), nullable=True),
    sa.Column('tem_acesso_app', sa.Boolean(), nullable=False),
    sa.Column('perfil_id', sa.UUID(), nullable=True),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('ativo', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['perfil_id'], ['perfis.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_entidades_empresa_id'), 'entidades', ['empresa_id'], unique=False)
    op.create_index(op.f('ix_entidades_tipo'), 'entidades', ['tipo'], unique=False)

    
def downgrade() -> None:
    op.drop_index(op.f('ix_entidades_tipo'), table_name='entidades')
    op.drop_index(op.f('ix_entidades_empresa_id'), table_name='entidades')
    op.drop_table('entidades')
    op.drop_table('perfis')
    # Apaga o ENUM no downgrade
    tipoentidade = postgresql.ENUM('CLIENTE', 'FUNCIONARIO', 'FORNECEDOR', name='tipoentidade')
    tipoentidade.drop(op.get_bind(), checkfirst=True)
