"""venda liga caixa movimento

Revision ID: 674dfc7efb6a
Revises: b4ec68374d40
Create Date: 2026-09-30 17:01:38.648248

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '674dfc7efb6a'
down_revision: Union[str, None] = 'b4ec68374d40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Corrige vendas antigas sem caixa - joga pro último caixa da empresa
    op.execute("""
        UPDATE vendas v SET caixa_id = c.id
        FROM (SELECT DISTINCT ON (empresa_id) id, empresa_id FROM caixas ORDER BY empresa_id, aberto_em DESC) c
        WHERE v.caixa_id IS NULL AND v.empresa_id = c.empresa_id
    """)

    # 2. Se ainda sobrar alguma sem caixa (empresa sem caixa ainda), deleta ou mantém nullable
    # Vamos manter nullable=True por enquanto pra não travar. O modelo já exige False, mas o banco deixa True
    # Se quiser forçar NOT NULL, descomenta a linha abaixo APÓS o update acima funcionar:
    # op.alter_column('vendas', 'caixa_id', existing_type=sa.UUID(), nullable=False)

    # 3. Troca FK para RESTRICT com nome fixo
    op.drop_constraint('fk_vendas_caixa_id', 'vendas', type_='foreignkey')
    op.create_foreign_key('fk_vendas_caixa_id_restrict', 'vendas', 'caixas', ['caixa_id'], ['id'], ondelete='RESTRICT')

    # 4. Índice que faltava
    op.create_index(op.f('ix_venda_itens_venda_id'), 'venda_itens', ['venda_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_venda_itens_venda_id'), table_name='venda_itens')
    op.drop_constraint('fk_vendas_caixa_id_restrict', 'vendas', type_='foreignkey')
    op.create_foreign_key('fk_vendas_caixa_id', 'vendas', 'caixas', ['caixa_id'], ['id'], ondelete='CASCADE')
    op.alter_column('vendas', 'caixa_id', existing_type=sa.UUID(), nullable=True)
