from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from decimal import Decimal
import uuid
import asyncio
import logging
import threading
import os
from datetime import datetime, timezone
from typing import Tuple
from jos_api.modules.caixa.models import Caixa, CaixaStatus, MotivoFechamento, CaixaMovimento, TipoMovimento, OrigemMovimento
from jos_api.modules.venda.models import Venda
from jos_api.modules.atividade.service import registrar_atividade
from jos_api.core.events import emit
from jos_api.core.realtime import manager
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)
TZ_LUANDA = ZoneInfo("Africa/Luanda")

def _broadcast_safe(empresa_id, payload: dict):
    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast(str(empresa_id), payload))
        except RuntimeError:
            asyncio.run(manager.broadcast(str(empresa_id), payload))
    except Exception as e:
        logger.warning(f"[WS] caixa broadcast fail {e}")

def _whatsapp_async(func, *args, **kwargs):
    def run():
        try: func(*args, **kwargs)
        except Exception as e: logger.error(f"[WHATSAPP BG] {e}")
    threading.Thread(target=run, daemon=True).start()

def _get_dono_phone_sync(db: Session, empresa_id: uuid.UUID) -> str:
    try:
        from jos_api.modules.empresa.models import Empresa
        emp = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        if emp and emp.phone:
            num = emp.phone.strip().replace("+","").replace(" ","").replace("-","")
            if len(num)==9: num="244"+num
            return num
    except: pass
    return os.getenv("WHATSAPP_DONO_NUMERO","").replace("+","").replace(" ","").replace("-","")

def get_caixa_aberto(db: Session, empresa_id: uuid.UUID) -> Caixa | None:
    return db.query(Caixa).filter(Caixa.empresa_id == empresa_id, Caixa.status == CaixaStatus.ABERTO).order_by(Caixa.aberto_em.desc()).first()

def calcular_saldo_atual(db: Session, caixa: Caixa) -> Decimal:
    total_mov = db.query(func.coalesce(func.sum(CaixaMovimento.valor), 0)).filter(CaixaMovimento.caixa_id == caixa.id, CaixaMovimento.tipo!= TipoMovimento.ABERTURA).scalar()
    return caixa.saldo_inicial + Decimal(str(total_mov or 0))

def _tipo_str(t): return t.value if hasattr(t, 'value') else str(t)

def registrar_movimento(db: Session, caixa: Caixa, tipo: TipoMovimento, valor: Decimal, descricao: str, user_id: uuid.UUID, user_nome: str, venda_id: uuid.UUID | None = None, forma_pagamento: str | None = None, origem: OrigemMovimento = OrigemMovimento.MANUAL, commit: bool = True) -> CaixaMovimento:
    mov = CaixaMovimento(empresa_id=caixa.empresa_id, caixa_id=caixa.id, tipo=tipo, origem=origem, valor=valor, descricao=descricao, venda_id=venda_id, forma_pagamento=forma_pagamento, criado_por=user_id, criado_por_nome=user_nome)
    db.add(mov)
    if commit:
        db.commit(); db.refresh(mov)
        payload = {"id": str(mov.id),"tipo": _tipo_str(mov.tipo),"valor": str(mov.valor),"descricao": mov.descricao,"criado_em": mov.criado_em.isoformat() if mov.criado_em else datetime.now(timezone.utc).isoformat(),"criado_por_nome": mov.criado_por_nome or user_nome,"aberto_por_nome": user_nome,"venda_id": str(venda_id) if venda_id else None,"forma_pagamento": forma_pagamento,"caixa_id": str(caixa.id),}
        emit(str(caixa.empresa_id), "caixa:extrato", data=payload, saldo_atual=str(calcular_saldo_atual(db, caixa)))
        _broadcast_safe(caixa.empresa_id, {"type": "caixa:extrato", "data": payload, "saldo_atual": str(calcular_saldo_atual(db, caixa))})
    return mov

def abrir_caixa(db: Session, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, saldo_inicial: Decimal, ip: str | None = None) -> Caixa:
    caixa_existente = get_caixa_aberto(db, empresa_id)
    if caixa_existente is not None:
        saldo_atual = calcular_saldo_atual(db, caixa_existente)
        caixa_info = {"id": str(caixa_existente.id), "aberto_por": str(caixa_existente.aberto_por), "aberto_por_nome": caixa_existente.aberto_por_nome, "aberto_em": caixa_existente.aberto_em.isoformat() if caixa_existente.aberto_em else None, "saldo_atual": float(saldo_atual), "saldo_inicial": float(caixa_existente.saldo_inicial)}
        if caixa_existente.aberto_por == user_id: raise HTTPException(status_code=409, detail={"code": "CAIXA_JA_ABERTO_POR_VOCE", "message": "Você já tem um caixa aberto", "caixa": caixa_info})
        raise HTTPException(status_code=409, detail={"code": "CAIXA_ABERTO_POR_OUTRO", "message": f"Já tem um caixa aberto por {caixa_existente.aberto_por_nome}", "caixa": caixa_info})
    novo = Caixa(empresa_id=empresa_id, aberto_por=user_id, aberto_por_nome=user_nome, saldo_inicial=saldo_inicial, status=CaixaStatus.ABERTO, motivo_fechamento=MotivoFechamento.NORMAL.value)
    db.add(novo); db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="CAIXA", acao="ABRIR", descricao=f"Abriu caixa com {saldo_inicial} - por {user_nome}", entidade="Caixa", entidade_id=novo.id, entidade_nome=f"Caixa {saldo_inicial}", user_id=user_id, user_nome=user_nome, detalhes={"saldo_inicial": str(saldo_inicial)}, ip=ip, commit=False)
    db.commit(); db.refresh(novo)
    payload = {"id": str(novo.id), "aberto_por_nome": novo.aberto_por_nome, "aberto_em": novo.aberto_em.isoformat() if novo.aberto_em else None, "saldo_inicial": str(novo.saldo_inicial), "status": "ABERTO"}
    emit(str(empresa_id), "caixa:update", data=payload)
    _broadcast_safe(empresa_id, {"type": "caixa:update", "data": payload})
    try:
        numero = _get_dono_phone_sync(db, empresa_id)
        if numero:
            from jos_api.core.whatsapp import enviar_abertura_caixa as wa_abrir
            aberto_em_safe = novo.aberto_em or datetime.now(timezone.utc)
            _whatsapp_async(wa_abrir, numero, novo.aberto_por_nome, novo.saldo_inicial, aberto_em_safe)
    except Exception as e: logger.warning(f"wa fail {e}")
    return novo

def forcar_abertura(db: Session, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, saldo_inicial: Decimal, motivo: str, ip: str | None = None) -> Tuple[Caixa, Caixa | None]:
    caixa_antigo = get_caixa_aberto(db, empresa_id)
    if caixa_antigo is None:
        novo = abrir_caixa(db, empresa_id, user_id, user_nome, saldo_inicial, ip)
        return novo, None
    saldo_esperado = calcular_saldo_atual(db, caixa_antigo)
    caixa_antigo.status = CaixaStatus.FECHADO; caixa_antigo.fechado_em = datetime.now(timezone.utc); caixa_antigo.fechado_por = user_id; caixa_antigo.fechado_por_nome = user_nome; caixa_antigo.motivo_fechamento = MotivoFechamento.FORCADO_TROCA_TURNO.value; caixa_antigo.observacao = f"Fechado por {user_nome} para abrir novo caixa. Motivo: {motivo}"; caixa_antigo.saldo_final_esperado = saldo_esperado; caixa_antigo.saldo_final_informado = saldo_esperado; caixa_antigo.divergencia = Decimal("0")
    novo = Caixa(empresa_id=empresa_id, aberto_por=user_id, aberto_por_nome=user_nome, saldo_inicial=saldo_inicial, status=CaixaStatus.ABERTO, motivo_fechamento=MotivoFechamento.NORMAL.value)
    db.add(novo); db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="CAIXA", acao="FORCAR_ABERTURA", descricao=f"Forçou abertura - fechou caixa de {caixa_antigo.aberto_por_nome}", entidade="Caixa", entidade_id=novo.id, entidade_nome=f"Caixa {saldo_inicial}", user_id=user_id, user_nome=user_nome, detalhes={"motivo": motivo}, ip=ip, commit=False)
    db.commit(); db.refresh(novo); db.refresh(caixa_antigo)
    try:
        numero = _get_dono_phone_sync(db, empresa_id)
        if numero:
            from jos_api.core.whatsapp import enviar_fechamento_caixa, enviar_abertura_caixa, format_kz
            movs = db.query(CaixaMovimento).filter(CaixaMovimento.caixa_id == caixa_antigo.id).all()
            total_ent = sum((m.valor for m in movs if m.valor and m.valor > 0 and str(m.tipo) != "ABERTURA"), Decimal("0"))
            qtd_vendas = sum(1 for m in movs if "VENDA" in str(m.tipo).upper())
            aberto_safe = caixa_antigo.aberto_em or datetime.now(timezone.utc)
            dados = {"aberto_por_nome": caixa_antigo.aberto_por_nome, "aberto": aberto_safe.astimezone(TZ_LUANDA).strftime("%H:%M"), "fechado": datetime.now(TZ_LUANDA).strftime("%H:%M"), "duracao": "", "total_ent": total_ent, "total_sai": Decimal("0"), "qtd_vendas": qtd_vendas, "saldo_entregar": saldo_esperado, "divergencia": Decimal("0"), "status_div": "✅", "qtd_hoje": 1, "fechado_por_nome": user_nome}
            _whatsapp_async(enviar_fechamento_caixa, numero, dados)
            _whatsapp_async(enviar_abertura_caixa, numero, novo.aberto_por_nome, novo.saldo_inicial, novo.aberto_em or datetime.now(timezone.utc))
    except: pass
    payload = {"id": str(novo.id), "status": "ABERTO", "aberto_por_nome": novo.aberto_por_nome, "antigo_id": str(caixa_antigo.id)}
    emit(str(empresa_id), "caixa:update", data=payload); _broadcast_safe(empresa_id, {"type": "caixa:update", "data": payload})
    return novo, caixa_antigo

def fechar_caixa(db: Session, empresa_id: uuid.UUID, user_id: uuid.UUID, saldo_informado: Decimal, fechado_por_nome: str, ip: str | None = None) -> Caixa:
    caixa = get_caixa_aberto(db, empresa_id)
    if caixa is None: raise HTTPException(status_code=400, detail="Nenhum caixa aberto")
    from jos_api.modules.mesa.models import Mesa, MesaStatus
    mesas_ocupadas = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.status == MesaStatus.OCUPADA).count()
    if mesas_ocupadas > 0: raise HTTPException(status_code=400, detail=f"Existem {mesas_ocupadas} mesas ocupadas.")
    saldo_esperado = calcular_saldo_atual(db, caixa)
    caixa.status = CaixaStatus.FECHADO; caixa.fechado_em = datetime.now(timezone.utc); caixa.fechado_por = user_id; caixa.fechado_por_nome = fechado_por_nome; caixa.saldo_final_esperado = saldo_esperado; caixa.saldo_final_informado = saldo_informado; caixa.divergencia = saldo_informado - saldo_esperado; caixa.motivo_fechamento = MotivoFechamento.NORMAL.value
    db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="CAIXA", acao="FECHAR", descricao=f"Fechou caixa - Esperado {saldo_esperado} Informado {saldo_informado}", entidade="Caixa", entidade_id=caixa.id, entidade_nome=f"Caixa {saldo_esperado}", user_id=user_id, user_nome=fechado_por_nome, detalhes={"esperado": str(saldo_esperado)}, ip=ip, commit=False)
    db.commit(); db.refresh(caixa)
    try:
        numero = _get_dono_phone_sync(db, empresa_id)
        if numero:
            movs = db.query(CaixaMovimento).filter(CaixaMovimento.caixa_id == caixa.id).all()
            total_ent = sum((m.valor for m in movs if m.valor and m.valor > 0 and str(m.tipo) != "ABERTURA"), Decimal("0"))
            total_sai = sum((m.valor for m in movs if m.valor and m.valor < 0), Decimal("0"))
            qtd_vendas = sum(1 for m in movs if "VENDA" in str(m.tipo).upper())
            aberto_dt = caixa.aberto_em or datetime.now(timezone.utc)
            fechado_dt = caixa.fechado_em or datetime.now(timezone.utc)
            aberto = aberto_dt.astimezone(TZ_LUANDA).strftime("%H:%M")
            fechado = fechado_dt.astimezone(TZ_LUANDA).strftime("%H:%M")
            duracao = ""
            try:
                diff = fechado_dt - aberto_dt
                h = int(diff.total_seconds() // 3600); m = int((diff.total_seconds() % 3600)//60)
                duracao = f" ({h}h {m}min)"
            except: duracao = ""
            dados = {"aberto_por_nome": caixa.aberto_por_nome, "aberto": aberto, "fechado": fechado, "duracao": duracao, "total_ent": total_ent, "total_sai": abs(total_sai), "qtd_vendas": qtd_vendas, "saldo_entregar": caixa.saldo_final_esperado or Decimal("0"), "divergencia": caixa.divergencia or Decimal("0"), "status_div": "✅" if (caixa.divergencia or 0)==0 else "⚠️", "qtd_hoje": 1, "fechado_por_nome": fechado_por_nome}
            from jos_api.core.whatsapp import enviar_fechamento_caixa
            _whatsapp_async(enviar_fechamento_caixa, numero, dados)
    except Exception as e: logger.warning(f"whatsapp fechamento fail {e}")
    payload = {"id": str(caixa.id), "status": "FECHADO", "fechado_por_nome": fechado_por_nome, "aberto_por_nome": caixa.aberto_por_nome, "divergencia": str(caixa.divergencia)}
    emit(str(empresa_id), "caixa:update", data=payload); _broadcast_safe(empresa_id, {"type": "caixa:update", "data": payload})
    return caixa

def registrar_venda_no_caixa(db: Session, caixa: Caixa, venda: Venda, user_id: uuid.UUID, user_nome: str) -> CaixaMovimento:
    return registrar_movimento(db=db, caixa=caixa, tipo=TipoMovimento.VENDA, valor=venda.total, descricao=f"Venda #{venda.numero} - {getattr(venda, 'forma_pagamento', 'N/A') or 'N/A'} - Resp: {user_nome}", user_id=user_id, user_nome=user_nome, venda_id=venda.id, forma_pagamento=getattr(venda, 'forma_pagamento', None), origem=OrigemMovimento.VENDA)
