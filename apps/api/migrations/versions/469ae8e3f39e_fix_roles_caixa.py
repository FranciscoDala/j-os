"""fix roles caixa

Revision ID: 469ae8e3f39e
Revises: 9e3a3e010763
Create Date: 2026-10-03 10:05:55.228926

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '469ae8e3f39e'
down_revision: Union[str, None] = '9e3a3e010763'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Cria o tipo tipoentidade se não existir
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipoentidade') THEN
                CREATE TYPE tipoentidade AS ENUM ('CLIENTE', 'FUNCIONARIO', 'FORNECEDOR');
            END IF;
        END $$;
    """)

    # 2. Garante que os valores novos existem no enum roleenum
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'gerente_restaurante'")
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'operador_caixa'")
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'caixa'")
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'garcom'")
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'vigilante'")
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'rh'")
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'dono'")
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'funcionario'")

    # 3. Entidades - adiciona coluna tipo se não existir
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entidades' AND column_name='tipo') THEN
                ALTER TABLE entidades ADD COLUMN tipo tipoentidade NOT NULL DEFAULT 'FUNCIONARIO'::tipoentidade;
            END IF;
        END $$;
    """)

    op.create_index(op.f('ix_entidades_email'), 'entidades', ['email'], unique=False, if_not_exists=True)
    op.create_index(op.f('ix_entidades_perfil_id'), 'entidades', ['perfil_id'], unique=False, if_not_exists=True)
    op.create_index(op.f('ix_entidades_tipo'), 'entidades', ['tipo'], unique=False, if_not_exists=True)
    op.create_index(op.f('ix_entidades_user_id'), 'entidades', ['user_id'], unique=False, if_not_exists=True)

    op.alter_column('user_empresas', 'role',
               existing_type=postgresql.ENUM('DONO', 'FUNCIONARIO', 'gerente_restaurante', 'operador_caixa', 'caixa', 'garcom', 'vigilante', 'rh', 'dono', 'funcionario', name='roleenum'),
               server_default='funcionario',
               existing_nullable=False)

    op.alter_column('users', 'role',
               existing_type=postgresql.ENUM('DONO', 'FUNCIONARIO', 'gerente_restaurante', 'operador_caixa', 'caixa', 'garcom', 'vigilante', 'rh', 'dono', 'funcionario', name='roleenum'),
               server_default='funcionario',
               existing_nullable=False)

    # 4. Limpa orfãos antes de criar FK - FIX do erro anterior
    op.execute("DELETE FROM user_empresas WHERE empresa_id NOT IN (SELECT id FROM empresas)")
    op.execute("DELETE FROM users WHERE empresa_id IS NOT NULL AND empresa_id NOT IN (SELECT id FROM empresas)")

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_user_empresas_empresa_id') THEN
                ALTER TABLE user_empresas ADD CONSTRAINT fk_user_empresas_empresa_id FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_users_empresa_id') THEN
                ALTER TABLE users ADD CONSTRAINT fk_users_empresa_id FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;
            END IF;
        END $$;
    """)

def downgrade() -> None:
    op.drop_constraint('fk_users_empresa_id', 'users', type_='foreignkey')
    op.drop_constraint('fk_user_empresas_empresa_id', 'user_empresas', type_='foreignkey')
    op.drop_index(op.f('ix_entidades_user_id'), table_name='entidades')
    op.drop_index(op.f('ix_entidades_tipo'), table_name='entidades')
    op.drop_index(op.f('ix_entidades_perfil_id'), table_name='entidades')
    op.drop_index(op.f('ix_entidades_email'), table_name='entidades')
