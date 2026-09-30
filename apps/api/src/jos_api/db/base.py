from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# REGISTRO CENTRAL - só adiciona linha nova aqui
from jos_api.modules.auth.models import User, UserEmpresa # noqa: F401
from jos_api.modules.empresa.models import Empresa # noqa: F401
from jos_api.modules.empresa.perfis_models import Perfil # noqa: F401
from jos_api.modules.entidades.models import Entidade # noqa: F401
from jos_api.modules.produto.models import Product # noqa: F401
from jos_api.modules.mesa.models import Mesa # noqa: F401
from jos_api.modules.venda.models import Venda, VendaItem # noqa: F401
from jos_api.modules.caixa.models import Caixa, CaixaMovimento # noqa: F401
from jos_api.modules.atividade.models import AtividadeLog # noqa: F401 - NOVO
