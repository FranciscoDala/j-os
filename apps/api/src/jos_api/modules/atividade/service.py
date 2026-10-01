from sqlalchemy.orm import Session
import uuid
from typing import Optional, Any
from decimal import Decimal
import json

from jos_api.modules.atividade.models import AtividadeLog

def _to_jsonable(obj: Any):
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_jsonable(x) for x in obj]
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if hasattr(obj, 'isoformat'): # datetime
        try: return obj.isoformat()
        except: pass
    return obj

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
    return entry

log = registrar_atividade

def get_nome(obj: Any) -> str:
    if not obj: return "N/A"
    for c in ["nome", "nome_produto", "numero", "codigo", "entidade_nome"]:
        if hasattr(obj, c) and getattr(obj, c):
            return str(getattr(obj, c))
    return str(getattr(obj, "id", ""))[:12]
