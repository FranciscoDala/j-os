import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from.models import Mesa, MesaReserva, MesaStatus, ReservaStatus

def list_mesas(db: Session, empresa_id: uuid.UUID, status: str = "", zona: str = "", search: str = ""):
    try:
        q = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.ativa == True)
        if status:
            try:
                q = q.filter(Mesa.status == MesaStatus(status))
            except: pass
        if zona: q = q.filter(Mesa.zona == zona)
        if search: q = q.filter(or_(Mesa.numero.ilike(f"%{search}%"), Mesa.zona.ilike(f"%{search}%")))
        mesas = q.order_by(Mesa.numero).all()
    except Exception as e:
        print(f"[MESAS] Erro list: {e}")
        return []

    out = []
    for m in mesas:
        try:
            reserva = None
            if m.status == MesaStatus.RESERVADA:
                reserva = db.query(MesaReserva).filter(MesaReserva.mesa_id == m.id, MesaReserva.status == ReservaStatus.PENDENTE).order_by(MesaReserva.data_reserva.desc()).first()

            tempo = None
            if m.aberta_em and m.status == MesaStatus.OCUPADA:
                try:
                    tempo = int((datetime.utcnow() - m.aberta_em).total_seconds() / 60)
                except: tempo = None

            venda_atual_id = m.venda_atual_id
            venda_total = 0

            # Tenta buscar venda só se precisar, mas nunca quebra a listagem
            if m.status == MesaStatus.OCUPADA:
                try:
                    from jos_api.modules.venda.models import Venda, VendaStatus
                    venda = None
                    if venda_atual_id:
                        venda = db.query(Venda).filter(Venda.id == venda_atual_id, Venda.empresa_id == empresa_id, Venda.status == VendaStatus.ABERTA).first()
                    if not venda:
                        venda = db.query(Venda).filter(Venda.mesa_id == m.id, Venda.empresa_id == empresa_id, Venda.status == VendaStatus.ABERTA).order_by(Venda.created_at.desc()).first()
                        if venda:
                            venda_atual_id = venda.id
                            m.venda_atual_id = venda.id
                            db.commit()
                    if venda:
                        venda_total = float(getattr(venda, 'total', 0) or 0)
                    else:
                        # Mesa ocupada sem venda aberta -> auto-libera mas não quebra
                        print(f"[MESAS] Auto-liberando órfã {m.numero}")
                        m.status = MesaStatus.LIVRE
                        m.venda_atual_id = None
                        m.garcom_id = None
                        m.aberta_em = None
                        m.pessoas_atual = 0
                        db.commit()
                        venda_atual_id = None
                        if status == "OCUPADA":
                            continue
                except Exception as e:
                    print(f"[MESAS] Erro venda lookup {m.numero}: {e}")
                    # Não auto-libera se foi erro de import, só ignora
                    pass

            d = {**m.__dict__}
            d["reserva_ativa"] = reserva
            d["tempo_ocupada_min"] = tempo
            d["venda_atual_id"] = venda_atual_id
            d["venda_total"] = venda_total
            out.append(d)
        except Exception as e:
            print(f"[MESAS] Erro mesa {m.id}: {e}")
            continue
    return out

def create_mesa(db: Session, empresa_id: uuid.UUID, data: dict):
    exists = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.numero == data["numero"].upper().strip(), Mesa.ativa == True).first()
    if exists: raise ValueError(f"Mesa {data['numero']} já existe")
    data["numero"] = data["numero"].upper().strip()
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

def ocupar(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID, venda_id: uuid.UUID | None, garcom_id: uuid.UUID | None, pessoas: int | None = None):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    if mesa.status == MesaStatus.OCUPADA and mesa.venda_atual_id:
        raise ValueError("Mesa já está ocupada")
    mesa.status = MesaStatus.OCUPADA
    if venda_id:
        mesa.venda_atual_id = venda_id
    mesa.garcom_id = garcom_id
    mesa.aberta_em = datetime.utcnow()
    if pessoas: mesa.pessoas_atual = pessoas
    res = db.query(MesaReserva).filter(MesaReserva.mesa_id == mesa_id, MesaReserva.status == ReservaStatus.PENDENTE).order_by(MesaReserva.data_reserva.desc()).first()
    if res:
        res.status = ReservaStatus.CHECKIN
        if venda_id: res.venda_id = venda_id
    db.commit(); db.refresh(mesa)
    return mesa

def liberar(db: Session, empresa_id: uuid.UUID, mesa_id: uuid.UUID, limpar: bool = False):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id, Mesa.empresa_id == empresa_id).first()
    if not mesa: raise ValueError("Mesa não encontrada")
    mesa.status = MesaStatus.SUJA if limpar else MesaStatus.LIVRE
    mesa.venda_atual_id = None
    mesa.garcom_id = None
    mesa.aberta_em = None
    mesa.pessoas_atual = 0
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
