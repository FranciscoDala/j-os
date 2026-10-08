import uuid
import secrets
import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from.models import Mesa, MesaReserva, MesaStatus, ReservaStatus
from jos_api.core.realtime import manager

logger = logging.getLogger(__name__)

def _gen_token():
    return secrets.token_urlsafe(6).upper()[:8]

def _safe_iso(dt):
    if dt is None:
        return None
    try:
        return dt.isoformat()
    except:
        return str(dt) if dt else None

def _broadcast_safe(empresa_id, payload: dict):
    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast(str(empresa_id), payload))
        except RuntimeError:
            asyncio.run(manager.broadcast(str(empresa_id), payload))
    except Exception as e:
        logger.warning(f"[WS] mesa broadcast fail {e} {payload.get('type')}")

def _to_dict(m):
    return {
        "id": m.id,
        "empresa_id": m.empresa_id,
        "numero": m.numero,
        "capacidade": m.capacidade,
        "zona": m.zona,
        "status": m.status,
        "venda_atual_id": m.venda_atual_id,
        "garcom_id": m.garcom_id,
        "aberta_em": m.aberta_em,
        "pessoas_atual": m.pessoas_atual or 0,
        "pos_x": m.pos_x or 0,
        "pos_y": m.pos_y or 0,
        "ativa": m.ativa,
        "qr_token": getattr(m, 'qr_token', None),
        "qr_token_criado_em": getattr(m, 'qr_token_criado_em', None),
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }

def list_mesas(db: Session, empresa_id: uuid.UUID, status: str = "", zona: str = "", search: str = ""):
    q = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.ativa == True)
    if status:
        try: q = q.filter(Mesa.status == MesaStatus(status))
        except: pass
    if zona: q = q.filter(Mesa.zona == zona)
    if search: q = q.filter(or_(Mesa.numero.ilike(f"%{search}%"), Mesa.zona.ilike(f"%{search}%")))
    mesas = q.order_by(Mesa.numero).all()
    out = []
    for m in mesas:
        reserva = None
        if m.status == MesaStatus.RESERVADA:
            reserva = db.query(MesaReserva).filter(MesaReserva.mesa_id == m.id, MesaReserva.status == ReservaStatus.PENDENTE).order_by(MesaReserva.data_reserva.desc()).first()
        tempo = None
        if m.aberta_em and m.status == MesaStatus.OCUPADA:
            try: tempo = int((datetime.utcnow() - m.aberta_em).total_seconds() / 60)
            except: pass
        venda_total = 0
        try:
            from jos_api.modules.venda.models import Venda, VendaStatus
            if m.venda_atual_id:
                v = db.query(Venda).filter(Venda.id == m.venda_atual_id, Venda.status == VendaStatus.ABERTA).first()
                if v: venda_total = float(v.total or 0)
        except: pass
        d = _to_dict(m)
        d["reserva_ativa"] = reserva
        d["tempo_ocupada_min"] = tempo
        d["venda_total"] = venda_total
        out.append(d)
    return out

def create_mesa(db: Session, empresa_id: uuid.UUID, data: dict):
    exists = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.numero == data["numero"].upper().strip(), Mesa.ativa == True).first()
    if exists: raise ValueError(f"Mesa {data['numero']} já existe")
    data["numero"] = data["numero"].upper().strip()
    mesa = Mesa(empresa_id=empresa_id, **data)
    db.add(mesa); db.commit(); db.refresh(mesa)
    try:
        status_val = mesa.status.value if hasattr(mesa.status, 'value') else str(mesa.status)
        _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "numero": mesa.numero, "status": status_val, "acao": "created"}})
    except: pass
    return mesa

def reservar(db: Session, empresa_id: uuid.UUID, payload):
    mesa = db.query(Mesa).filter(Mesa.id == payload.mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    if mesa.status == MesaStatus.OCUPADA: raise ValueError("Mesa ocupada")
    reserva = MesaReserva(empresa_id=empresa_id, mesa_id=payload.mesa_id, cliente_nome=payload.cliente_nome, cliente_telefone=payload.cliente_telefone, pessoas=payload.pessoas, data_reserva=payload.data_reserva)
    mesa.status = MesaStatus.RESERVADA
    db.add(reserva); db.commit(); db.refresh(reserva)
    _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "numero": mesa.numero, "status": "RESERVADA"}})
    return reserva

def ocupar(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID, venda_id: uuid.UUID | None, garcom_id: uuid.UUID | None, pessoas: int | None = None):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    if mesa.status == MesaStatus.OCUPADA:
        raise ValueError("Mesa já está ocupada")
    mesa.status = MesaStatus.OCUPADA
    if venda_id: mesa.venda_atual_id = venda_id
    mesa.garcom_id = garcom_id
    mesa.aberta_em = datetime.utcnow()
    mesa.pessoas_atual = pessoas or mesa.capacidade
    mesa.qr_token = _gen_token()
    mesa.qr_token_criado_em = datetime.utcnow()
    db.commit(); db.refresh(mesa)
    _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "numero": mesa.numero, "status": "OCUPADA", "venda_atual_id": str(mesa.venda_atual_id) if mesa.venda_atual_id else None, "qr_token": mesa.qr_token}})
    return mesa

def liberar(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID, limpar: bool = False):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    mesa.status = MesaStatus.SUJA if limpar else MesaStatus.LIVRE
    mesa.venda_atual_id = None
    mesa.garcom_id = None
    mesa.aberta_em = None
    mesa.pessoas_atual = 0
    mesa.qr_token = None
    mesa.qr_token_criado_em = None
    db.commit(); db.refresh(mesa)
    status_val = mesa.status.value if hasattr(mesa.status, 'value') else str(mesa.status)
    _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "numero": mesa.numero, "status": status_val}})
    return mesa

def rotacionar_token(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    mesa.qr_token = _gen_token()
    mesa.qr_token_criado_em = datetime.utcnow()
    db.commit(); db.refresh(mesa)
    try:
        status_val = mesa.status.value if hasattr(mesa.status, 'value') else str(mesa.status)
        _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "numero": mesa.numero, "qr_token": mesa.qr_token, "status": status_val}})
    except: pass
    return {
        "id": str(mesa.id),
        "numero": mesa.numero,
        "qr_token": mesa.qr_token,
        "qr_token_criado_em": _safe_iso(mesa.qr_token_criado_em)
    }

def update_mesa(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID, data: dict):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    for k,v in data.items():
        if v is not None: setattr(mesa, k, v)
    db.commit(); db.refresh(mesa)
    try:
        status_val = mesa.status.value if hasattr(mesa.status, 'value') else str(mesa.status)
        _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "numero": mesa.numero, "status": status_val}})
    except: pass
    return mesa

def delete_mesa(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    mesa.ativa = False
    db.commit()
    _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "deleted": True}})
    return True

def zonas_lista(db: Session, empresa_id: uuid.UUID):
    rows = db.query(Mesa.zona).filter(Mesa.empresa_id == empresa_id, Mesa.ativa == True).distinct().all()
    return [r[0] for r in rows if r[0]]
