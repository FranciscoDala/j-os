from typing import Dict, List, Optional, Any
from fastapi import WebSocket
import json
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}
        self.redis: Any = None
        self.pubsub: Any = None
        self.listen_task: Optional[asyncio.Task] = None
        self._redis_enabled = False

    async def connect_redis(self):
        try:
            from jos_api.core.config import settings
            redis_url = getattr(settings, "REDIS_URL", None)
            if not redis_url:
                logger.warning("[WS] REDIS_URL não configurada - modo LOCAL")
                return
            try:
                import redis.asyncio as aioredis # type: ignore
            except ImportError:
                logger.warning("[WS] lib redis não instalada")
                return
            self.redis = aioredis.from_url(redis_url, decode_responses=True) # type: ignore
            self.pubsub = self.redis.pubsub() # type: ignore
            await self.pubsub.subscribe("jos:broadcast") # type: ignore
            self.listen_task = asyncio.create_task(self._redis_listener())
            self._redis_enabled = True
            logger.info("[WS] Redis ON")
        except Exception as e:
            logger.warning(f"[WS] Redis OFF: {e}")
            self.redis = None
            self.pubsub = None
            self._redis_enabled = False

    async def _redis_listener(self):
        if not self.pubsub:
            return
        try:
            async for message in self.pubsub.listen(): # type: ignore
                if message.get("type") == "message": # type: ignore
                    try:
                        data = json.loads(message.get("data", "{}")) # type: ignore
                        empresa_id = data.get("empresa_id")
                        payload = data.get("payload")
                        if empresa_id and payload:
                            await self._broadcast_local(str(empresa_id), payload)
                    except Exception as e:
                        logger.error(f"[WS] listener error: {e}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"[WS] listener quebrou: {e}")

    async def connect(self, empresa_id: str, ws: WebSocket):
        empresa_id = str(empresa_id)
        try:
            await ws.accept()
        except:
            return
        if empresa_id not in self.active:
            self.active[empresa_id] = []
        self.active[empresa_id].append(ws)

    def disconnect(self, empresa_id: str, ws: WebSocket):
        empresa_id = str(empresa_id)
        lst = self.active.get(empresa_id)
        if lst and ws in lst:
            lst.remove(ws)
            if not lst:
                del self.active[empresa_id]

    async def _broadcast_local(self, empresa_id: str, payload: dict):
        empresa_id = str(empresa_id)
        conns = self.active.get(empresa_id)
        if not conns:
            return
        if "ts" not in payload:
            payload["ts"] = datetime.utcnow().isoformat()
        for ws in conns[:]:
            try:
                await ws.send_json(payload)
            except:
                try:
                    await ws.send_text(json.dumps(payload, default=str))
                except:
                    self.disconnect(empresa_id, ws)

    async def broadcast(self, empresa_id: Optional[str], payload: dict):
        if not empresa_id:
            return
        empresa_id = str(empresa_id)
        await self._broadcast_local(empresa_id, payload)
        if self.redis and self._redis_enabled:
            try:
                data = json.dumps({"empresa_id": empresa_id, "payload": payload}, default=str)
                await self.redis.publish("jos:broadcast", data) # type: ignore
            except Exception as e:
                logger.error(f"[WS] publish fail: {e}")

    # === ALIAS STOCKBOT ===
    async def broadcast_to_loja(self, empresa_id: str, payload: dict):
        await self.broadcast(empresa_id, payload)

    async def close(self):
        if self.listen_task:
            self.listen_task.cancel()
            try:
                await self.listen_task
            except asyncio.CancelledError:
                pass
        if self.pubsub:
            try:
                await self.pubsub.unsubscribe("jos:broadcast") # type: ignore
            except:
                pass
            try:
                await self.pubsub.close() # type: ignore
            except:
                pass
        if self.redis:
            try:
                await self.redis.close() # type: ignore
            except:
                pass

manager = ConnectionManager()
