from fastapi import APIRouter
from jos_api.modules.auth.routes import router as auth_router
from jos_api.modules.empresa.routes import router as empresa_router
from jos_api.modules.entidades.routes import router as entidades_router
from jos_api.modules.produto.routes import router as produto_router
from jos_api.modules.venda.routes import router as venda_router
from jos_api.modules.mesa.routes import router as mesa_router
from jos_api.modules.caixa.routes import router as caixa_router
from jos_api.modules.atividade.routes import router as atividade_router
from jos_api.core.realtime_router import router as realtime_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(empresa_router)
api_router.include_router(entidades_router)
api_router.include_router(produto_router)
api_router.include_router(caixa_router)
api_router.include_router(mesa_router)
api_router.include_router(venda_router)
api_router.include_router(atividade_router)
api_router.include_router(realtime_router)
