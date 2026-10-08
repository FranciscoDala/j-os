from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from decimal import Decimal
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Tuple
from jos_api.modules.caixa.models import Caixa, CaixaStatus, MotivoFechamento, CaixaMovimento, TipoMovimento, OrigemMovimento
from jos_api.modules.venda.models import Venda
from jos_api.modules.atividade.service import registrar_atividade
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
        logger.warning(f"[WS] caixa broadcast fail {e}")

def get_caixa_aberto(db: Session, empresa_id: uuid.UUID) -> Caixa | None:
    return db.query(Caixa).filter(Caixa.empresa_id == empresa_id, Caixa.status == CaixaStatus.ABERTO).order_by(Caixa.aberto_em.desc()).first()

def calcular_saldo_atual(db: Session, caixa: Caixa) -> Decimal:
    total_mov = db.query(func.coalesce(func.sum(CaixaMovimento.valor), 0)).filter(CaixaMovimento.caixa_id == caixa.id, CaixaMovimento.tipo!= TipoMovimento.ABERTURA).scalar()
    return caixa.saldo_inicial + Decimal(str(total_mov or 0))

def _tipo_str(t):
    return t.value if hasattr(t, 'value') else str(t)

def registrar_movimento(db: Session, caixa: Caixa, tipo: TipoMovimento, valor: Decimal, descricao: str, user_id: uuid.UUID, user_nome: str, venda_id: uuid.UUID | None = None, forma_pagamento: str | None = None, origem: OrigemMovimento = OrigemMovimento.MANUAL, commit: bool = True) -> CaixaMovimento:
    mov = CaixaMovimento(empresa_id=caixa.empresa_id, caixa_id=caixa.id, tipo=tipo, origem=origem, valor=valor, descricao=descricao, venda_id=venda_id, forma_pagamento=forma_pagamento, criado_por=user_id, criado_por_nome=user_nome)
    db.add(mov)
    if commit:
        db.commit(); db.refresh(mov)
        payload = {
            "id": str(mov.id),
            "tipo": _tipo_str(mov.tipo),
            "valor": str(mov.valor),
            "descricao": mov.descricao,
            "criado_em": mov.criado_em.isoformat() if mov.criado_em else datetime.now(timezone.utc).isoformat(),
            "criado_por_nome": mov.criado_por_nome or user_nome,
            "aberto_por_nome": user_nome,
            "venda_id": str(venda_id) if venda_id else None,
            "forma_pagamento": forma_pagamento,
            "caixa_id": str(caixa.id),
        }
        emit(str(caixa.empresa_id), "caixa:extrato", data=payload, saldo_atual=str(calcular_saldo_atual(db, caixa)))
        emit(str(caixa.empresa_id), "caixa:atualizado", data=payload)
        # WS REAL
        _broadcast_safe(caixa.empresa_id, {"type": "caixa:extrato", "data": payload, "saldo_atual": str(calcular_saldo_atual(db, caixa))})
        _broadcast_safe(caixa.empresa_id, {"type": "caixa.updated", "data": payload})
        _broadcast_safe(caixa.empresa_id, {"type": "caixa:atualizado", "data": payload})
        _broadcast_safe(caixa.empresa_id, {"type": "stats.updated", "acao": "caixa_movimento"})

        # NOVO: NOTIFICAÇÃO DE SANGRIA / SUPRIMENTO / VENDA GRANDE
        tipo_str = _tipo_str(mov.tipo).upper()
        if tipo_str in ["SANGRIA", "SUPRIMENTO"] or abs(float(mov.valor)) >= 50000: # notifica saída grande
            _broadcast_safe(caixa.empresa_id, {
                "type": "notificacao:nova",
                "data": {
                    "id": f"caixa-{mov.id}",
                    "tipo": "CAIXA_SANGRIA" if "SANGRIA" in tipo_str else "CAIXA_SUPRIMENTO" if "SUPRIMENTO" in tipo_str else "CAIXA_MOV",
                    "titulo": f"{tipo_str.title()}: Kz {abs(float(mov.valor)):.2f}",
                    "desc": mov.descricao,
                    "time": "agora",
                    "valor": str(mov.valor),
                    "criado_por_nome": user_nome,
                    "caixa_id": str(caixa.id),
                    "severity": "warning" if "SANGRIA" in tipo_str else "info"
                }
            })
            # também evento dedicado
            _broadcast_safe(caixa.empresa_id, {
                "type": "caixa:movimento_alto" if abs(float(mov.valor)) >= 50000 else f"caixa:{tipo_str.lower()}",
                "data": payload
            })

    return mov


def abrir_caixa(db: Session, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, saldo_inicial: Decimal, ip: str | None = None) -> Caixa:
    caixa_existente = get_caixa_aberto(db, empresa_id)
    if caixa_existente is not None:
        saldo_atual = calcular_saldo_atual(db, caixa_existente)
        caixa_info = {"id": str(caixa_existente.id), "aberto_por": str(caixa_existente.aberto_por), "aberto_por_nome": caixa_existente.aberto_por_nome, "aberto_em": caixa_existente.aberto_em.isoformat() if caixa_existente.aberto_em else None, "saldo_atual": float(saldo_atual), "saldo_inicial": float(caixa_existente.saldo_inicial)}
        if caixa_existente.aberto_por == user_id:
            raise HTTPException(status_code=409, detail={"code": "CAIXA_JA_ABERTO_POR_VOCE", "message": f"Você já tem um caixa aberto", "caixa": caixa_info})
        raise HTTPException(status_code=409, detail={"code": "CAIXA_ABERTO_POR_OUTRO", "message": f"Já tem um caixa aberto por {caixa_existente.aberto_por_nome}", "caixa": caixa_info})
    novo = Caixa(empresa_id=empresa_id, aberto_por=user_id, aberto_por_nome=user_nome, saldo_inicial=saldo_inicial, status=CaixaStatus.ABERTO, motivo_fechamento=MotivoFechamento.NORMAL.value)
    db.add(novo); db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="CAIXA", acao="ABRIR", descricao=f"Abriu caixa com R$ {saldo_inicial} - por {user_nome}", entidade="Caixa", entidade_id=novo.id, entidade_nome=f"Caixa R$ {saldo_inicial}", user_id=user_id, user_nome=user_nome, detalhes={"saldo_inicial": str(saldo_inicial)}, ip=ip, commit=False)
    db.commit(); db.refresh(novo)
    payload = {"id": str(novo.id), "aberto_por_nome": novo.aberto_por_nome, "aberto_em": novo.aberto_em.isoformat() if novo.aberto_em else None, "saldo_inicial": str(novo.saldo_inicial), "status": "ABERTO"}
    emit(str(empresa_id), "caixa:update", data=payload)
    _broadcast_safe(empresa_id, {"type": "caixa:update", "data": payload})
    _broadcast_safe(empresa_id, {"type": "caixa.updated", "data": payload})
    _broadcast_safe(empresa_id, {"type": "caixa:atualizado", "data": payload})
    return novo

def forcar_abertura(db: Session, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, saldo_inicial: Decimal, motivo: str, ip: str | None = None) -> Tuple[Caixa, Caixa | None]:
    caixa_antigo = get_caixa_aberto(db, empresa_id)
    if caixa_antigo is None:
        novo = abrir_caixa(db, empresa_id, user_id, user_nome, saldo_inicial, ip)
        return novo, None
    saldo_esperado = calcular_saldo_atual(db, caixa_antigo)
    caixa_antigo.status = CaixaStatus.FECHADO
    caixa_antigo.fechado_em = datetime.now(timezone.utc)
    caixa_antigo.fechado_por = user_id
    caixa_antigo.fechado_por_nome = user_nome
    caixa_antigo.motivo_fechamento = MotivoFechamento.FORCADO_TROCA_TURNO.value
    caixa_antigo.observacao = f"Fechado por {user_nome} para abrir novo caixa. Motivo: {motivo}. Caixa original de {caixa_antigo.aberto_por_nome}"
    caixa_antigo.saldo_final_esperado = saldo_esperado
    caixa_antigo.saldo_final_informado = saldo_esperado
    caixa_antigo.divergencia = Decimal("0")
    novo = Caixa(empresa_id=empresa_id, aberto_por=user_id, aberto_por_nome=user_nome, saldo_inicial=saldo_inicial, status=CaixaStatus.ABERTO, motivo_fechamento=MotivoFechamento.NORMAL.value)
    db.add(novo); db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="CAIXA", acao="FORCAR_ABERTURA", descricao=f"Forçou abertura - fechou caixa de {caixa_antigo.aberto_por_nome} R$ {saldo_esperado} - novo R$ {saldo_inicial} - {motivo}", entidade="Caixa", entidade_id=novo.id, entidade_nome=f"Caixa R$ {saldo_inicial}", user_id=user_id, user_nome=user_nome, detalhes={"motivo": motivo, "antigo_id": str(caixa_antigo.id)}, ip=ip, commit=False)
    db.commit(); db.refresh(novo); db.refresh(caixa_antigo)
    payload = {"id": str(novo.id), "status": "ABERTO", "aberto_por_nome": novo.aberto_por_nome, "antigo_id": str(caixa_antigo.id)}
    emit(str(empresa_id), "caixa:update", data=payload)
    _broadcast_safe(empresa_id, {"type": "caixa:update", "data": payload})
    _broadcast_safe(empresa_id, {"type": "caixa.updated", "data": payload})
    return novo, caixa_antigo

def fechar_caixa(db: Session, empresa_id: uuid.UUID, user_id: uuid.UUID, saldo_informado: Decimal, fechado_por_nome: str, ip: str | None = None) -> Caixa:
    caixa = get_caixa_aberto(db, empresa_id)
    if caixa is None: raise HTTPException(status_code=400, detail="Nenhum caixa aberto")
    from jos_api.modules.mesa.models import Mesa, MesaStatus
    mesas_ocupadas = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.status == MesaStatus.OCUPADA).count()
    if mesas_ocupadas > 0:
        raise HTTPException(status_code=400, detail=f"Existem {mesas_ocupadas} mesas ocupadas. Feche as comandas antes.")
    saldo_esperado = calcular_saldo_atual(db, caixa)
    caixa.status = CaixaStatus.FECHADO
    caixa.fechado_em = datetime.now(timezone.utc)
    caixa.fechado_por = user_id
    caixa.fechado_por_nome = fechado_por_nome
    caixa.saldo_final_esperado = saldo_esperado
    caixa.saldo_final_informado = saldo_informado
    caixa.divergencia = saldo_informado - saldo_esperado
    caixa.motivo_fechamento = MotivoFechamento.NORMAL.value
    db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="CAIXA", acao="FECHAR", descricao=f"Fechou caixa - Esperado R$ {saldo_esperado} Informado R$ {saldo_informado} Divergência R$ {caixa.divergencia} - Aberto por {caixa.aberto_por_nome} Fechado por {fechado_por_nome}", entidade="Caixa", entidade_id=caixa.id, entidade_nome=f"Caixa R$ {saldo_esperado}", user_id=user_id, user_nome=fechado_por_nome, detalhes={"esperado": str(saldo_esperado), "informado": str(saldo_informado), "divergencia": str(caixa.divergencia), "aberto_por": caixa.aberto_por_nome}, ip=ip, commit=False)
    db.commit(); db.refresh(caixa)
    payload = {"id": str(caixa.id), "status": "FECHADO", "fechado_por_nome": fechado_por_nome, "aberto_por_nome": caixa.aberto_por_nome, "divergencia": str(caixa.divergencia)}
    emit(str(empresa_id), "caixa:update", data=payload)
    _broadcast_safe(empresa_id, {"type": "caixa:update", "data": payload})
    _broadcast_safe(empresa_id, {"type": "caixa.updated", "data": payload})
    _broadcast_safe(empresa_id, {"type": "caixa:atualizado", "data": payload})
    return caixa

def registrar_venda_no_caixa(db: Session, caixa: Caixa, venda: Venda, user_id: uuid.UUID, user_nome: str) -> CaixaMovimento:
    return registrar_movimento(db=db, caixa=caixa, tipo=TipoMovimento.VENDA, valor=venda.total, descricao=f"Venda #{venda.numero} - {getattr(venda, 'forma_pagamento', 'N/A') or 'N/A'} - Resp: {user_nome}", user_id=user_id, user_nome=user_nome, venda_id=venda.id, forma_pagamento=getattr(venda, 'forma_pagamento', None), origem=OrigemMovimento.VENDA)
