from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from jos_api.core.config import settings
from jos_api.api.v1.api import api_router

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # WS no Render precisa de * pra handshake
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"status": "online", "docs": "/docs", "ws": f"{settings.API_V1_STR}/realtime/ws"}

@app.get("/health")
def health():
    return {"status": "ok"}
