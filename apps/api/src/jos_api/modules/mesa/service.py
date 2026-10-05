import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .models import Mesa, MesaReserva, MesaStatus, ReservaStatus

def list_mesas(db: Session, empresa_id: uuid.UUID, status: str = "", zona: str = "", search: str = ""):
    q = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.ativa == True)
    if status: q = q.filter(Mesa.status == status)
    if zona: q = q.filter(Mesa.zona == zona)
    if search: q = q.filter(or_(Mesa.numero.ilike(f"%{search}%"), Mesa.zona.ilike(f"%{search}%")))
    mesas = q.order_by(Mesa.numero).all()
    result = []
    for m in mesas:
        reserva = None
        if m.status == MesaStatus.RESERVADA:
            reserva = db.query(MesaReserva).filter(MesaReserva.mesa_id == m.id, MesaReserva.status == ReservaStatus.PENDENTE).order_by(MesaReserva.data_reserva.desc()).first()
        tempo = None
        if m.aberta_em and m.status == MesaStatus.OCUPADA:
            tempo = int((datetime.utcnow() - m.aberta_em).total_seconds() / 60)
        result.append({**m.__dict__, "reserva_ativa": reserva, "tempo_ocupada_min": tempo})
    return result

def create_mesa(db: Session, empresa_id: uuid.UUID, data: dict):
    mesa = Mesa(empresa_id=empresa_id, **data)
    db.add(mesa); db.commit(); db.refresh(mesa)
    return mesa

def reservar(db: Session, empresa_id: uuid.UUID, payload):
    mesa = db.query(Mesa).filter(Mesa.id == payload.mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    if mesa.status == MesaStatus.OCUPADA: raise ValueError("Mesa ocupada")
    reserva = MesaReserva(empresa_id=empresa_id, mesa_id=payload.mesa_id, cliente_nome=payload.cliente_nome, cliente_telefone=payload.cliente_telefone, pessoas=payload.pessoas, data_reserva=payload.data_reserva)
    mesa.status = MesaStatus.RESERVADA
    db.add(reserva); db.commit(); db.refresh(reserva)
    return reserva

def ocupar(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID, venda_id: uuid.UUID | None, garcom_id: uuid.UUID | None):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    mesa.status = MesaStatus.OCUPADA
    mesa.venda_atual_id = venda_id
    mesa.garcom_id = garcom_id
    mesa.aberta_em = datetime.utcnow()
    # se tinha reserva pendente, marca checkin
    res = db.query(MesaReserva).filter(MesaReserva.mesa_id == mesa_id, MesaReserva.status == ReservaStatus.PENDENTE).order_by(MesaReserva.data_reserva.desc()).first()
    if res:
        res.status = ReservaStatus.CHECKIN
        res.venda_id = venda_id
    db.commit(); db.refresh(mesa)
    return mesa

def liberar(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID, limpar: bool = False):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    mesa.status = MesaStatus.SUJA if limpar else MesaStatus.LIVRE
    mesa.venda_atual_id = None
    mesa.garcom_id = None
    mesa.aberta_em = None
    db.commit(); db.refresh(mesa)
    return mesa

def update_mesa(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID, data: dict):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    for k,v in data.items():
        if v is not None: setattr(mesa, k, v)
    db.commit(); db.refresh(mesa)
    return mesa

def delete_mesa(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    mesa.ativa = False
    db.commit()
    return True

def zonas_lista(db: Session, empresa_id: uuid.UUID):
    rows = db.query(Mesa.zona).filter(Mesa.empresa_id == empresa_id, Mesa.ativa == True).distinct().all()
    return [r[0] for r in rows if r[0]]
