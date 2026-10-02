from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jos_api.core.realtime import manager
from jos_api.core.config import settings
from jose import jwt
import json

router = APIRouter(prefix="/realtime", tags=["Realtime"])

def _decode(token: str):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

@router.websocket("/ws")
async def ws_realtime(ws: WebSocket, token: str = Query(...)):
    try:
        payload = _decode(token)
        empresa_id = payload.get("empresa_id")
        if not empresa_id:
            await ws.close(code=1008)
            return
    except Exception:
        try:
            await ws.close(code=1008)
        except:
            pass
        return

    await manager.connect(str(empresa_id), ws)

    # tenta mandar reservas, mas se falhar não derruba o WS
    try:
        from jos_api.db.session import SessionLocal
        from jos_api.modules.venda import service as venda_service
        import uuid
        db = SessionLocal()
        try:
            reservas = venda_service.get_reservas_ativas(db, uuid.UUID(str(empresa_id)))
            await ws.send_text(json.dumps({
                "type": "reserva:init",
                "data": [{"produto_id": str(r.produto_id), "user_id": str(r.user_id), "quantidade": str(r.quantidade)} for r in reservas]
            }, default=str))
        finally:
            db.close()
    except Exception as e:
        print(f"[ws] reserva:init fail {e}")
        # mesmo se falhar, continua conectado

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(str(empresa_id), ws)
    except:
        manager.disconnect(str(empresa_id), ws)
