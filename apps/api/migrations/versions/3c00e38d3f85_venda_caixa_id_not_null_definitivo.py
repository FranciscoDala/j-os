"""venda caixa_id not null definitivo

Revision ID: 3c00e38d3f85
Revises: 674dfc7efb6a
Create Date: 2026-09-30 17:06:21.179820

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '3c00e38d3f85'
down_revision: Union[str, None] = '674dfc7efb6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.alter_column('vendas', 'caixa_id',
        existing_type=sa.UUID(),
        nullable=False)

def downgrade() -> None:
    op.alter_column('vendas', 'caixa_id',
        existing_type=sa.UUID(),
        nullable=True)
