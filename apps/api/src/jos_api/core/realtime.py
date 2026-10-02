from typing import Dict, List
from fastapi import WebSocket
import json
from datetime import datetime
import asyncio

class ConnectionManager:
    def __init__(self):
        # empresa_id (str) -> lista de websockets
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, empresa_id: str, ws: WebSocket):
        await ws.accept()
        if empresa_id not in self.active:
            self.active[empresa_id] = []
        self.active[empresa_id].append(ws)

    def disconnect(self, empresa_id: str, ws: WebSocket):
        if empresa_id in self.active and ws in self.active[empresa_id]:
            self.active[empresa_id].remove(ws)

    async def broadcast(self, empresa_id: str, payload: dict):
        if empresa_id not in self.active:
            return
        # adiciona timestamp
        payload["ts"] = datetime.utcnow().isoformat()
        data = json.dumps(payload, default=str)
        # envia para todos da empresa
        for ws in self.active[empresa_id][:]:
            try:
                await ws.send_text(data)
            except:
                # remove conexão morta
                try:
                    self.active[empresa_id].remove(ws)
                except:
                    pass

manager = ConnectionManager()

# helper síncrono pra chamar de dentro do service (sync) via router
def broadcast_sync(empresa_id, payload: dict):
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast(str(empresa_id), payload))
        else:
            loop.run_until_complete(manager.broadcast(str(empresa_id), payload))
    except:
        pass # não quebra venda se WS falhar
