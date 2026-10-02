from typing import Dict, List, Optional
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
        empresa_id = str(empresa_id)
        if empresa_id not in self.active:
            self.active[empresa_id] = []
        self.active[empresa_id].append(ws)
        print(f"[WS] connect empresa={empresa_id} total={len(self.active[empresa_id])}")

    def disconnect(self, empresa_id: str, ws: WebSocket):
        empresa_id = str(empresa_id)
        if empresa_id in self.active and ws in self.active[empresa_id]:
            self.active[empresa_id].remove(ws)
            print(f"[WS] disconnect empresa={empresa_id} restam={len(self.active[empresa_id])}")
            if not self.active[empresa_id]:
                del self.active[empresa_id]

    async def broadcast(self, empresa_id: Optional[str], payload: dict):
        if not empresa_id:
            print(f"[WS] broadcast sem empresa_id type={payload.get('type')}")
            return
        empresa_id = str(empresa_id)
        if empresa_id not in self.active:
            print(f"[WS] broadcast empresa={empresa_id} sem conexões ativas - type={payload.get('type')}")
            return
        payload["ts"] = datetime.utcnow().isoformat()
        data = json.dumps(payload, default=str)
        print(f"[WS] broadcast empresa={empresa_id} type={payload.get('type')} para {len(self.active[empresa_id])} clients")
        for ws in self.active[empresa_id][:]:
            try:
                await ws.send_text(data)
            except Exception as e:
                print(f"[WS] send fail {e}")
                try:
                    self.active[empresa_id].remove(ws)
                except:
                    pass

manager = ConnectionManager()
