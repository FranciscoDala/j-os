from fastapi import APIRouter, Depends, HTTPException, Body, Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
import uuid
from pydantic import BaseModel
from jos_api.db.session import get_db
from jos_api.core.deps import precisa_modulo, get_perfil_atual, get_current_user, precisa_caixa_aberto
from jos_api.modules.caixa import schemas, service
from jos_api.modules.caixa.models import Caixa, CaixaMovimento, TipoMovimento
from jos_api.modules.auth.models import User
from jos_api.modules.atividade.service import registrar_atividade

router = APIRouter(prefix="/caixa", tags=["Caixa Universal"])

def _get_empresa_id(perfil_data) -> uuid.UUID:
    eid = perfil_data.get("empresa_id")
    if not eid: raise HTTPException(status_code=403, detail="Sem empresa vinculada")
    return uuid.UUID(eid) if isinstance(eid, str) else eid

def _get_nome(user: User, perfil_data) -> str:
    return getattr(user, 'nome', None) or getattr(user, 'full_name', None) or getattr(user, 'email', None) or perfil_data.get("perfil_nome", "Usuário")

def _get_ip(request: Request): return request.client.host if request.client else None

@router.get("/status")
def status_caixa(db: Session = Depends(get_db), perfil_data = Depends(get_perfil_atual)):
    empresa_id = _get_empresa_id(perfil_data)
    caixa = service.get_caixa_aberto(db, empresa_id)
    if not caixa: return {"aberto": False, "caixa_atual": None, "mensagem": "Caixa fechado"}
    saldo_atual = service.calcular_saldo_atual(db, caixa)
    return {"aberto": True, "caixa_atual": {"id": str(caixa.id), "aberto_por": str(caixa.aberto_por), "aberto_por_nome": caixa.aberto_por_nome, "aberto_em": caixa.aberto_em.isoformat() if caixa.aberto_em else None, "saldo_inicial": float(caixa.saldo_inicial), "saldo_atual": float(saldo_atual)}, "mensagem": f"Caixa aberto por {caixa.aberto_por_nome}"}

@router.post("/abrir", response_model=schemas.CaixaResponse)
def abrir_caixa(dados: schemas.CaixaAbrirRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    empresa_id = _get_empresa_id(perfil_data)
    nome = _get_nome(current_user, perfil_data)
    return service.abrir_caixa(db, empresa_id, current_user.id, nome, dados.saldo_inicial, ip=_get_ip(request))

@router.post("/forcar-abertura")
def forcar_abertura(dados: schemas.CaixaForcarAberturaRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    empresa_id = _get_empresa_id(perfil_data)
    nome = _get_nome(current_user, perfil_data)
    if not dados.motivo or len(dados.motivo.strip()) < 3: raise HTTPException(status_code=400, detail="Informe o motivo do fechamento forçado")
    novo, antigo = service.forcar_abertura(db, empresa_id, current_user.id, nome, dados.saldo_inicial, dados.motivo, ip=_get_ip(request))
    if antigo is None:
        return {"detail": "Nenhum caixa aberto, novo caixa criado", "caixa_novo": jsonable_encoder(schemas.CaixaResponse.model_validate(novo))}
    return {"detail": f"Caixa de {antigo.aberto_por_nome} fechado por {nome} e novo caixa aberto", "caixa_fechado": {"id": str(antigo.id), "aberto_por_nome": antigo.aberto_por_nome, "fechado_por_nome": antigo.fechado_por_nome, "observacao": antigo.observacao, "saldo_final_esperado": float(antigo.saldo_final_esperado) if antigo.saldo_final_esperado else 0}, "caixa_novo": jsonable_encoder(schemas.CaixaResponse.model_validate(novo))}

@router.post("/fechar", response_model=schemas.CaixaResponse)
def fechar_caixa(request: Request, saldo_informado: Decimal = Body(..., embed=True), db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    empresa_id = _get_empresa_id(perfil_data)
    nome = _get_nome(current_user, perfil_data)
    return service.fechar_caixa(db, empresa_id, current_user.id, saldo_informado, nome, ip=_get_ip(request))

@router.get("/extrato", response_model=schemas.ExtratoResponse)
def extrato_caixa(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), caixa_atual: Caixa = Depends(precisa_caixa_aberto)):
    movimentos = db.query(CaixaMovimento).filter(CaixaMovimento.caixa_id == caixa_atual.id).order_by(CaixaMovimento.criado_em.desc()).all()
    saldo_atual = service.calcular_saldo_atual(db, caixa_atual)
    total_entradas = db.query(func.coalesce(func.sum(CaixaMovimento.valor), 0)).filter(CaixaMovimento.caixa_id == caixa_atual.id, CaixaMovimento.valor > 0).scalar()
    total_saidas = db.query(func.coalesce(func.sum(CaixaMovimento.valor), 0)).filter(CaixaMovimento.caixa_id == caixa_atual.id, CaixaMovimento.valor < 0).scalar()
    return {"caixa_id": caixa_atual.id, "saldo_inicial": caixa_atual.saldo_inicial, "saldo_atual": saldo_atual, "total_entradas": Decimal(str(total_entradas)), "total_saidas": Decimal(str(total_saidas)), "movimentos": movimentos}

class SangriaRequest(BaseModel):
    valor: Decimal
    motivo: str

@router.post("/sangria", response_model=schemas.CaixaMovimentoResponse)
def sangria(dados: SangriaRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user), caixa_atual: Caixa = Depends(precisa_caixa_aberto)):
    nome = _get_nome(current_user, perfil_data)
    if dados.valor <= 0: raise HTTPException(status_code=400, detail="Valor deve ser positivo")
    mov = service.registrar_movimento(db, caixa_atual, TipoMovimento.SANGRIA, -abs(dados.valor), f"Sangria: {dados.motivo}", current_user.id, nome)
    registrar_atividade(db, empresa_id=caixa_atual.empresa_id, modulo="CAIXA", acao="SANGRIA", descricao=f"Sangria R$ {dados.valor} - {dados.motivo} - por {nome}", entidade="Caixa", entidade_id=caixa_atual.id, entidade_nome=f"Sangria R$ {dados.valor}", user_id=current_user.id, user_nome=nome, detalhes={"valor": str(dados.valor), "motivo": dados.motivo}, ip=_get_ip(request))
    return mov

@router.post("/suprimento", response_model=schemas.CaixaMovimentoResponse)
def suprimento(dados: SangriaRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user), caixa_atual: Caixa = Depends(precisa_caixa_aberto)):
    nome = _get_nome(current_user, perfil_data)
    if dados.valor <= 0: raise HTTPException(status_code=400, detail="Valor deve ser positivo")
    mov = service.registrar_movimento(db, caixa_atual, TipoMovimento.SUPRIMENTO, abs(dados.valor), f"Suprimento: {dados.motivo}", current_user.id, nome)
    registrar_atividade(db, empresa_id=caixa_atual.empresa_id, modulo="CAIXA", acao="SUPRIMENTO", descricao=f"Suprimento R$ {dados.valor} - {dados.motivo} - por {nome}", entidade="Caixa", entidade_id=caixa_atual.id, entidade_nome=f"Suprimento R$ {dados.valor}", user_id=current_user.id, user_nome=nome, detalhes={"valor": str(dados.valor), "motivo": dados.motivo}, ip=_get_ip(request))
    return mov

@router.get("/", response_model=list[schemas.CaixaResponse])
def listar_caixas(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id(perfil_data)
    return db.query(Caixa).filter(Caixa.empresa_id == empresa_id).order_by(Caixa.aberto_em.desc()).limit(50).all()
