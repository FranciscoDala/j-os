from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jos_api.core.realtime import manager
from jos_api.core.config import settings
from jose import jwt
import json
import asyncio
import uuid

router = APIRouter(prefix="/realtime", tags=["Realtime"])

def _decode(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        empresa_id = (
            payload.get("empresa_id") or
            payload.get("empresaId") or
            payload.get("empresa") or
            payload.get("company_id") or
            payload.get("loja_id")
        )
        if not empresa_id and "data" in payload:
            empresa_id = payload["data"].get("empresa_id")
        return empresa_id, payload
    except Exception as e:
        print(f"[WS] decode fail: {e}")
        return None, None

@router.websocket("/ws")
async def ws_realtime(ws: WebSocket, token: str = Query(...)):
    empresa_id, _ = _decode(token)

    if not empresa_id:
        print(f"[WS] token sem empresa_id")
        try:
            await ws.close(code=1008, reason="empresa_id missing")
        except:
            pass
        return

    empresa_id = str(empresa_id)
    await manager.connect(empresa_id, ws)

    # init reservas
    try:
        from jos_api.db.session import SessionLocal
        from jos_api.modules.venda import service as venda_service
        db = SessionLocal()
        try:
            reservas = venda_service.get_reservas_ativas(db, uuid.UUID(empresa_id))
            await ws.send_json({
                "type": "reserva:init",
                "data": [{"produto_id": str(r.produto_id), "user_id": str(r.user_id), "quantidade": str(r.quantidade)} for r in reservas]
            })
        finally:
            db.close()
    except Exception as e:
        print(f"[WS] reserva:init fail: {e}")

    # keep-alive Render (25s)
    try:
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=25.0)
                if data == "ping":
                    await ws.send_text("pong")
            except asyncio.TimeoutError:
                try:
                    await ws.send_json({"type": "ping", "ts": ""})
                except:
                    break
    except WebSocketDisconnect:
        manager.disconnect(empresa_id, ws)
    except Exception as e:
        print(f"[WS] loop error empresa={empresa_id}: {e}")
        manager.disconnect(empresa_id, ws)

@router.get("/health")
async def realtime_health():
    return {
        "active_empresas": len(manager.active),
        "total_connections": sum(len(v) for v in manager.active.values()),
        "redis": manager._redis_enabled
    }
