from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import uuid
from jos_api.db.session import get_db
from jos_api.core.deps import precisa_modulo
from jos_api.modules.atividade.models import AtividadeLog
from jos_api.modules.atividade import schemas

router = APIRouter(prefix="/atividade", tags=["Atividade"])

def _get_empresa_id(perfil_data) -> uuid.UUID:
    eid = perfil_data.get("empresa_id")
    if isinstance(eid, str): return uuid.UUID(eid)
    return eid

@router.get("/", response_model=list[schemas.AtividadeLogResponse])
def listar(
    modulo: str | None = None,
    acao: str | None = None,
    q: str | None = Query(None, description="busca por nome do produto/servico"),
    entidade: str | None = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    perfil_data = Depends(precisa_modulo("caixa"))
):
    empresa_id = _get_empresa_id(perfil_data)
    query = db.query(AtividadeLog).filter(AtividadeLog.empresa_id == empresa_id).order_by(AtividadeLog.created_at.desc())
    if modulo: query = query.filter(AtividadeLog.modulo == modulo.upper())
    if acao: query = query.filter(AtividadeLog.acao == acao.upper())
    if entidade: query = query.filter(AtividadeLog.entidade == entidade)
    if q:
        ilike = f"%{q}%"
        query = query.filter((AtividadeLog.entidade_nome.ilike(ilike)) | (AtividadeLog.descricao.ilike(ilike)))
    return query.limit(limit).all()
