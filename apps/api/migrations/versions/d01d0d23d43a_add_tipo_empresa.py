from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd01d0d23d43a'
down_revision: Union[str, None] = '779c17873764'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Cria o tipo ENUM primeiro
    tipoempresa = postgresql.ENUM('VAREJO', 'RESTAURANTE', 'SEGURANCA', 'SERVICOS', name='tipoempresa')
    tipoempresa.create(op.get_bind(), checkfirst=True)

    # 2. Agora adiciona a coluna
    op.add_column('empresas', sa.Column('tipo', sa.Enum('VAREJO', 'RESTAURANTE', 'SEGURANCA', 'SERVICOS', name='tipoempresa'), server_default='VAREJO', nullable=False))

def downgrade() -> None:
    op.drop_column('empresas', 'tipo')
    # Apaga o tipo
    tipoempresa = postgresql.ENUM('VAREJO', 'RESTAURANTE', 'SEGURANCA', 'SERVICOS', name='tipoempresa')
    tipoempresa.drop(op.get_bind(), checkfirst=True)
