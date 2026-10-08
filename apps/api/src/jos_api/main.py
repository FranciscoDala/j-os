from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from jos_api.core.config import settings
from jos_api.api.v1.api import api_router
from jos_api.core.realtime import manager
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    print("[MAIN] Iniciando J-OS API...")
    try:
        await manager.connect_redis()
        if manager._redis_enabled:
            print("[MAIN] WebSocket Redis ON - multi-instance pronto")
        else:
            print("[MAIN] WebSocket modo LOCAL - use 1 worker no Render ou configure REDIS_URL")
    except Exception as e:
        print(f"[MAIN] WS Redis falhou (seguindo em modo local): {e}")

    yield

    # SHUTDOWN
    print("[MAIN] Desligando...")
    try:
        await manager.close()
    except Exception as e:
        print(f"[MAIN] Erro ao fechar manager: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "docs": "/docs",
        "ws": f"{settings.API_V1_STR}/realtime/ws?token=SEU_JWT",
        "realtime": {
            "active_empresas": len(manager.active),
            "redis": manager._redis_enabled
        }
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "ws_empresas": len(manager.active),
        "ws_connections": sum(len(v) for v in manager.active.values()),
        "redis_enabled": manager._redis_enabled
    }
