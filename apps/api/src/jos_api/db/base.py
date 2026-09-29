from src.jos_api.db.session import Base

# IMPORTA TODOS OS MODELS AQUI - Alembic só enxerga o que está importado
from src.jos_api.modules.auth.models import User, UserEmpresa

__all__ = ["Base"]
