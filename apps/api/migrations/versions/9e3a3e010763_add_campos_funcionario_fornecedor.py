"""add campos funcionario fornecedor

Revision ID: 9e3a3e010763
Revises: 300d2a7458a8
Create Date: 2026-10-03 09:16:56.662294

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '9e3a3e010763'
down_revision: Union[str, None] = '300d2a7458a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('entidades', sa.Column('endereco', sa.String(length=255), nullable=True))
    op.add_column('entidades', sa.Column('cargo', sa.String(length=100), nullable=True))
    op.add_column('entidades', sa.Column('departamento', sa.String(length=100), nullable=True))
    op.add_column('entidades', sa.Column('salario', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('entidades', sa.Column('carga_horaria', sa.Integer(), nullable=True))
    op.add_column('entidades', sa.Column('data_admissao', sa.Date(), nullable=True))
    op.add_column('entidades', sa.Column('data_demissao', sa.Date(), nullable=True))
    op.add_column('entidades', sa.Column('empresa_fornecedora', sa.String(length=150), nullable=True))
    op.add_column('entidades', sa.Column('categoria_fornecedor', sa.String(length=100), nullable=True))

def downgrade() -> None:
    op.drop_column('entidades', 'categoria_fornecedor')
    op.drop_column('entidades', 'empresa_fornecedora')
    op.drop_column('entidades', 'data_demissao')
    op.drop_column('entidades', 'data_admissao')
    op.drop_column('entidades', 'carga_horaria')
    op.drop_column('entidades', 'salario')
    op.drop_column('entidades', 'departamento')
    op.drop_column('entidades', 'cargo')
    op.drop_column('entidades', 'endereco')
