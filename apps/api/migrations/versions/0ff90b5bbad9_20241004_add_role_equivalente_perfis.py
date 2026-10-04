"""add role_equivalente to perfis

Revision ID: 0ff90b5bbad9
Revises: 469ae8e3f39e
Create Date: 2026-10-04 10:34:43.029927

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = '0ff90b5bbad9'
down_revision: Union[str, None] = '469ae8e3f39e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Adiciona coluna
    op.add_column('perfis', sa.Column(
        'role_equivalente',
        sa.Enum('dono', 'gerente_restaurante', 'operador_caixa', 'caixa', 'garcom', 'vigilante', 'rh', 'funcionario', name='roleenum', create_type=False),
        nullable=False,
        server_default='funcionario'
    ))

    # 2. Corrige dados antigos - COM CAST ::roleenum
    op.execute("""
        UPDATE perfis SET role_equivalente =
            (CASE
                WHEN lower(slug) LIKE '%%dono%%' THEN 'dono'
                WHEN lower(slug) LIKE '%%gerente%%' THEN 'gerente_restaurante'
                WHEN lower(slug) = 'caixa' OR lower(slug) LIKE '%%operador%%' THEN 'operador_caixa'
                WHEN lower(slug) LIKE '%%garcom%%' THEN 'garcom'
                WHEN lower(slug) LIKE '%%vigilante%%' OR lower(slug) LIKE '%%agente%%' THEN 'vigilante'
                WHEN lower(slug) LIKE '%%rh%%' OR lower(slug) LIKE '%%financeiro%%' THEN 'rh'
                ELSE 'funcionario'
            END)::roleenum
    """)

    # 3. Cria constraint única
    try:
        op.drop_index('ux_perfis_empresa_slug', table_name='perfis')
    except Exception:
        pass

    op.create_unique_constraint('uq_perfil_empresa_slug', 'perfis', ['empresa_id', 'slug'])

    
def downgrade() -> None:
    op.drop_constraint('uq_perfil_empresa_slug', 'perfis', type_='unique')
    op.create_index('ux_perfis_empresa_slug', 'perfis', ['empresa_id', 'slug'], unique=True)
    op.drop_column('perfis', 'role_equivalente')
