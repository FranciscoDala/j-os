from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session
from jos_api.db.session import get_db
from jos_api.core.realtime import manager
from jos_api.core.config import settings
from jose import jwt
import json
from jos_api.modules.venda import service as venda_service
import uuid

router = APIRouter(prefix="/realtime", tags=["Realtime"])

def _decode(token: str):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

@router.websocket("/ws")
async def ws_realtime(ws: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    try:
        payload = _decode(token)
        empresa_id = payload.get("empresa_id")
        if not empresa_id:
            await ws.close(code=1008)
            return
    except Exception:
        await ws.close(code=1008)
        return
    await manager.connect(str(empresa_id), ws)
    try:
        reservas = venda_service.get_reservas_ativas(db, uuid.UUID(empresa_id))
        await ws.send_text(json.dumps({"type": "reserva:init", "data": [{"produto_id": str(r.produto_id), "user_id": str(r.user_id), "quantidade": str(r.quantidade)} for r in reservas]}, default=str))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(str(empresa_id), ws)
