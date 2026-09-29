from fastapi import APIRouter
from jos_api.modules.auth.routes import router as auth_router

api_router = APIRouter()
api_router.include_router(auth_router)

@api_router.get("/health")
def health():
    return {"status": "ok", "system": "J-OS", "owner": "Jenath Investimentos"}