from typing import Dict, List
from fastapi import WebSocket
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, empresa_id: str, ws: WebSocket):
        try:
            await ws.accept()
        except:
            return
        if empresa_id not in self.active:
            self.active[empresa_id] = []
        self.active[empresa_id].append(ws)

    def disconnect(self, empresa_id: str, ws: WebSocket):
        if empresa_id in self.active and ws in self.active[empresa_id]:
            self.active[empresa_id].remove(ws)
            if not self.active[empresa_id]:
                del self.active[empresa_id]

    async def broadcast(self, empresa_id: str, payload: dict):
        if empresa_id not in self.active:
            return
        payload["ts"] = datetime.utcnow().isoformat()
        data = json.dumps(payload, default=str)
        for ws in self.active[empresa_id][:]:
            try:
                await ws.send_text(data)
            except:
                try:
                    self.active[empresa_id].remove(ws)
                except:
                    pass

manager = ConnectionManager()
