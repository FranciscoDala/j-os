from fastapi import APIRouter, Depends, HTTPException, Body, Request, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from decimal import Decimal
import uuid
from pydantic import BaseModel
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from jos_api.db.session import get_db
from jos_api.core.deps import precisa_modulo, get_perfil_atual, get_current_user, precisa_caixa_aberto
from jos_api.modules.caixa import schemas, service
from jos_api.modules.caixa.models import Caixa, CaixaMovimento, TipoMovimento, CaixaStatus
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

def _range_luanda_para_utc(data_str: str):
    tz = ZoneInfo("Africa/Luanda")
    dia = datetime.strptime(data_str, "%Y-%m-%d")
    inicio = dia.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=tz)
    fim = dia.replace(hour=23, minute=59, second=59, microsecond=0, tzinfo=tz)
    return inicio.astimezone(timezone.utc).replace(tzinfo=None), fim.astimezone(timezone.utc).replace(tzinfo=None)

def _calc_extrato(caixas, db: Session):
    if not caixas:
        return [], Decimal("0"), Decimal("0"), Decimal("0"), Decimal("0")
    ids = [c.id for c in caixas if c is not None]
    if not ids:
        return [], Decimal("0"), Decimal("0"), Decimal("0"), Decimal("0")
    movs = db.query(CaixaMovimento).filter(CaixaMovimento.caixa_id.in_(ids)).order_by(CaixaMovimento.criado_em.asc()).all()
    total_ent = Decimal("0"); total_sai = Decimal("0"); saldo_ini = Decimal("0"); saldo_atu = Decimal("0")
    for c in caixas:
        if c is None: continue
        saldo_ini += c.saldo_inicial or Decimal("0")
        if c.status==CaixaStatus.ABERTO:
            saldo_atu += service.calcular_saldo_atual(db, c)
        else:
            saldo_atu += (c.saldo_final_esperado or c.saldo_inicial or Decimal("0"))
    for m in movs:
        if m is None: continue
        if str(m.tipo)=="ABERTURA": continue
        if m.valor is None: continue
        if m.valor>0: total_ent+=m.valor
        else: total_sai+=m.valor
    return movs, total_ent, total_sai, saldo_ini, saldo_atu

@router.get("/status")
def status_caixa(db: Session = Depends(get_db), perfil_data = Depends(get_perfil_atual)):
    empresa_id = _get_empresa_id(perfil_data)
    caixa = service.get_caixa_aberto(db, empresa_id)
    if not caixa: return {"aberto": False, "caixa_atual": None, "mensagem": "Caixa fechado"}
    saldo_atual = service.calcular_saldo_atual(db, caixa)
    return {"aberto": True, "caixa_atual": {"id": str(caixa.id), "aberto_por": str(caixa.aberto_por), "aberto_por_nome": caixa.aberto_por_nome, "aberto_em": caixa.aberto_em.isoformat() if caixa.aberto_em else None, "saldo_inicial": float(caixa.saldo_inicial), "saldo_atual": float(saldo_atual)}, "mensagem": f"Caixa aberto por {caixa.aberto_por_nome}"}

@router.post("/abrir", response_model=schemas.CaixaResponse)
def abrir_caixa(dados: schemas.CaixaAbrirRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    empresa_id = _get_empresa_id(perfil_data); nome = _get_nome(current_user, perfil_data)
    return service.abrir_caixa(db, empresa_id, current_user.id, nome, dados.saldo_inicial, ip=_get_ip(request))

@router.post("/forcar-abertura")
def forcar_abertura(dados: schemas.CaixaForcarAberturaRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    empresa_id = _get_empresa_id(perfil_data); nome = _get_nome(current_user, perfil_data)
    if not dados.motivo or len(dados.motivo.strip()) < 3: raise HTTPException(status_code=400, detail="Informe o motivo")
    novo, antigo = service.forcar_abertura(db, empresa_id, current_user.id, nome, dados.saldo_inicial, dados.motivo, ip=_get_ip(request))
    if antigo is None: return {"detail": "Nenhum caixa aberto, novo caixa criado", "caixa_novo": jsonable_encoder(schemas.CaixaResponse.model_validate(novo))}
    return {"detail": f"Fechado {antigo.aberto_por_nome}", "caixa_novo": jsonable_encoder(schemas.CaixaResponse.model_validate(novo))}

@router.post("/fechar", response_model=schemas.CaixaResponse)
def fechar_caixa(request: Request, saldo_informado: Decimal = Body(..., embed=True), db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    empresa_id = _get_empresa_id(perfil_data); nome = _get_nome(current_user, perfil_data)
    return service.fechar_caixa(db, empresa_id, current_user.id, saldo_informado, nome, ip=_get_ip(request))

@router.get("/historico")
def historico_caixas(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id(perfil_data)
    return db.query(Caixa).filter(Caixa.empresa_id == empresa_id).order_by(Caixa.aberto_em.desc()).limit(100).all()

@router.get("/extrato-por-data/{data_str}", response_model=schemas.ExtratoResponse)
def extrato_por_data(data_str: str, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id(perfil_data)
    try:
        inicio_utc, fim_utc = _range_luanda_para_utc(data_str)
    except:
        raise HTTPException(400, "Data invalida YYYY-MM-DD")
    caixas = db.query(Caixa).filter(Caixa.empresa_id==empresa_id, Caixa.aberto_em>=inicio_utc, Caixa.aberto_em<=fim_utc).order_by(Caixa.aberto_em.asc()).all()
    if not caixas:
        c = db.query(Caixa).filter(Caixa.empresa_id==empresa_id, Caixa.aberto_em<=fim_utc, (Caixa.fechado_em==None)|(Caixa.fechado_em>=inicio_utc)).order_by(Caixa.aberto_em.desc()).first()
        caixas = [c] if c else []
    if not caixas:
        return {"caixa_id": uuid.uuid4(), "saldo_inicial": Decimal("0"), "saldo_atual": Decimal("0"), "total_entradas": Decimal("0"), "total_saidas": Decimal("0"), "movimentos": [], "qtd_caixas":0, "periodo_inicio":data_str, "periodo_fim":data_str}
    movs, ent, sai, ini, atu = _calc_extrato(caixas, db)
    saldo_ini_ret = caixas[0].saldo_inicial if len(caixas)==1 else ini
    saldo_atu_ret = caixas[0].saldo_final_esperado or atu if len(caixas)==1 and caixas[0].status!=CaixaStatus.ABERTO else atu
    return {"caixa_id": caixas[0].id, "saldo_inicial": saldo_ini_ret, "saldo_atual": saldo_atu_ret, "total_entradas": ent, "total_saidas": sai, "movimentos": movs, "qtd_caixas": len(caixas), "periodo_inicio":data_str, "periodo_fim":data_str}

@router.get("/extrato-por-periodo", response_model=schemas.ExtratoResponse)
def extrato_por_periodo(inicio: str = Query(..., description="YYYY-MM-DD"), fim: str = Query(..., description="YYYY-MM-DD"), db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id(perfil_data)
    try:
        inicio_utc, _ = _range_luanda_para_utc(inicio)
        _, fim_utc = _range_luanda_para_utc(fim)
    except:
        raise HTTPException(400, "Datas invalidas YYYY-MM-DD")
    caixas = db.query(Caixa).filter(Caixa.empresa_id==empresa_id, Caixa.aberto_em>=inicio_utc, Caixa.aberto_em<=fim_utc).order_by(Caixa.aberto_em.asc()).all()
    if not caixas:
        return {"caixa_id": uuid.uuid4(), "saldo_inicial": Decimal("0"), "saldo_atual": Decimal("0"), "total_entradas": Decimal("0"), "total_saidas": Decimal("0"), "movimentos": [], "qtd_caixas":0, "periodo_inicio":inicio, "periodo_fim":fim}
    movs, ent, sai, ini, atu = _calc_extrato(caixas, db)
    return {"caixa_id": caixas[0].id, "saldo_inicial": ini, "saldo_atual": atu, "total_entradas": ent, "total_saidas": sai, "movimentos": movs, "qtd_caixas": len(caixas), "periodo_inicio":inicio, "periodo_fim":fim}

@router.get("/extrato", response_model=schemas.ExtratoResponse)
def extrato_caixa(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), caixa_atual: Caixa = Depends(precisa_caixa_aberto)):
    movs = db.query(CaixaMovimento).filter(CaixaMovimento.caixa_id==caixa_atual.id).order_by(CaixaMovimento.criado_em.asc()).all()
    ent = sum((m.valor for m in movs if m.valor and m.valor>0 and str(m.tipo)!="ABERTURA"), Decimal("0"))
    sai = sum((m.valor for m in movs if m.valor and m.valor<0), Decimal("0"))
    return {"caixa_id": caixa_atual.id, "saldo_inicial": caixa_atual.saldo_inicial, "saldo_atual": service.calcular_saldo_atual(db, caixa_atual), "total_entradas": ent, "total_saidas": sai, "movimentos": movs, "qtd_caixas":1}

@router.get("/{caixa_id}/extrato", response_model=schemas.ExtratoResponse)
def extrato_por_id(caixa_id: uuid.UUID, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id(perfil_data)
    caixa = db.query(Caixa).filter(Caixa.id==caixa_id, Caixa.empresa_id==empresa_id).first()
    if not caixa: raise HTTPException(404, "Caixa não encontrado")
    movs = db.query(CaixaMovimento).filter(CaixaMovimento.caixa_id==caixa.id).order_by(CaixaMovimento.criado_em.asc()).all()
    ent = sum((m.valor for m in movs if m.valor and m.valor>0 and str(m.tipo)!="ABERTURA"), Decimal("0"))
    sai = sum((m.valor for m in movs if m.valor and m.valor<0), Decimal("0"))
    saldo = service.calcular_saldo_atual(db, caixa) if caixa.status==CaixaStatus.ABERTO else (caixa.saldo_final_esperado or caixa.saldo_inicial)
    return {"caixa_id": caixa.id, "saldo_inicial": caixa.saldo_inicial, "saldo_atual": saldo, "total_entradas": ent, "total_saidas": sai, "movimentos": movs, "qtd_caixas":1}

class SangriaRequest(BaseModel):
    valor: Decimal; motivo: str

@router.post("/sangria", response_model=schemas.CaixaMovimentoResponse)
def sangria(dados: SangriaRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user), caixa_atual: Caixa = Depends(precisa_caixa_aberto)):
    nome = _get_nome(current_user, perfil_data)
    if dados.valor <= 0: raise HTTPException(400, "Valor deve ser positivo")
    mov = service.registrar_movimento(db, caixa_atual, TipoMovimento.SANGRIA, -abs(dados.valor), f"Sangria: {dados.motivo}", current_user.id, nome)
    registrar_atividade(db, empresa_id=caixa_atual.empresa_id, modulo="CAIXA", acao="SANGRIA", descricao=f"Sangria {dados.valor} - {dados.motivo}", entidade="Caixa", entidade_id=caixa_atual.id, entidade_nome=f"Sangria {dados.valor}", user_id=current_user.id, user_nome=nome, detalhes={"valor": str(dados.valor), "motivo": dados.motivo}, ip=_get_ip(request))
    return mov

@router.post("/suprimento", response_model=schemas.CaixaMovimentoResponse)
def suprimento(dados: SangriaRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user), caixa_atual: Caixa = Depends(precisa_caixa_aberto)):
    nome = _get_nome(current_user, perfil_data)
    if dados.valor <= 0: raise HTTPException(400, "Valor deve ser positivo")
    mov = service.registrar_movimento(db, caixa_atual, TipoMovimento.SUPRIMENTO, abs(dados.valor), f"Suprimento: {dados.motivo}", current_user.id, nome)
    registrar_atividade(db, empresa_id=caixa_atual.empresa_id, modulo="CAIXA", acao="SUPRIMENTO", descricao=f"Suprimento {dados.valor} - {dados.motivo}", entidade="Caixa", entidade_id=caixa_atual.id, entidade_nome=f"Suprimento {dados.valor}", user_id=current_user.id, user_nome=nome, detalhes={"valor": str(dados.valor), "motivo": dados.motivo}, ip=_get_ip(request))
    return mov

@router.get("/", response_model=list[schemas.CaixaResponse])
def listar_caixas(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id(perfil_data)
    return db.query(Caixa).filter(Caixa.empresa_id==empresa_id).order_by(Caixa.aberto_em.desc()).limit(50).all()
