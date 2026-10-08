from sqlalchemy.orm import Session
import uuid
from typing import Optional, Any
from decimal import Decimal
import asyncio
import logging
from jos_api.modules.atividade.models import AtividadeLog
from jos_api.core.events import emit
from jos_api.core.realtime import manager

logger = logging.getLogger(__name__)

def _broadcast_safe(empresa_id, payload: dict):
    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast(str(empresa_id), payload))
        except RuntimeError:
            asyncio.run(manager.broadcast(str(empresa_id), payload))
    except Exception as e:
        logger.warning(f"[WS] atividade broadcast fail {e}")

def _to_jsonable(obj: Any):
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_jsonable(x) for x in obj]
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if hasattr(obj, 'isoformat'):
        try: return obj.isoformat()
        except: pass
    return obj

def _safe_iso(dt):
    if dt is None: return None
    try: return dt.isoformat()
    except: return str(dt)

def registrar_atividade(
    db: Session,
    empresa_id: uuid.UUID,
    modulo: str,
    acao: str,
    descricao: str,
    entidade: Optional[str] = None,
    entidade_id: Optional[uuid.UUID] = None,
    entidade_nome: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    user_nome: str = "Sistema",
    detalhes: Optional[dict] = None,
    ip: Optional[str] = None,
    commit: bool = True
):
    clean_detalhes = _to_jsonable(detalhes) if detalhes else None
    entry = AtividadeLog(
        empresa_id=empresa_id,
        user_id=user_id,
        user_nome=user_nome or "Sistema",
        modulo=modulo.upper(),
        acao=acao.upper(),
        entidade=entidade,
        entidade_id=entidade_id,
        entidade_nome=entidade_nome,
        descricao=descricao,
        detalhes=clean_detalhes,
        ip=ip
    )
    db.add(entry)
    if commit:
        db.commit()
        db.refresh(entry)
        payload = {
            "id": str(entry.id),
            "user_nome": entry.user_nome,
            "modulo": entry.modulo,
            "acao": entry.acao,
            "entidade": entry.entidade,
            "entidade_nome": entry.entidade_nome,
            "descricao": entry.descricao,
            "created_at": _safe_iso(entry.created_at)
        }
        try: emit(str(empresa_id), "atividade:nova", data=payload)
        except: pass
        _broadcast_safe(empresa_id, {"type": "atividade:nova", "data": payload})
        _broadcast_safe(empresa_id, {"type": "atividade.update", "data": payload})
    else:
        db.flush()
        try:
            payload = {
                "id": str(entry.id),
                "user_nome": entry.user_nome,
                "modulo": entry.modulo,
                "acao": entry.acao,
                "entidade": entry.entidade,
                "entidade_nome": entry.entidade_nome,
                "descricao": entry.descricao,
                "created_at": _safe_iso(getattr(entry, 'created_at', None))
            }
            emit(str(empresa_id), "atividade:nova", data=payload)
            _broadcast_safe(empresa_id, {"type": "atividade:nova", "data": payload})
        except: pass
    return entry

log = registrar_atividade

def get_nome(obj: Any) -> str:
    if not obj: return "N/A"
    for c in ["nome", "nome_produto", "numero", "codigo", "entidade_nome"]:
        if hasattr(obj, c) and getattr(obj, c):
            return str(getattr(obj, c))
    return str(getattr(obj, "id", ""))[:12]
