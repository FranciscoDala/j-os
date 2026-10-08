from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException
from datetime import datetime
import asyncio
import logging
from. import models
from. import schemas
from.seed import seed_perfis_por_tipo
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.core.realtime import manager
from jos_api.core.events import emit

logger = logging.getLogger(__name__)

def _broadcast_safe(empresa_id, payload: dict):
    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast(str(empresa_id), payload))
        except RuntimeError:
            asyncio.run(manager.broadcast(str(empresa_id), payload))
    except Exception as e:
        logger.warning(f"[WS] empresa broadcast fail {e}")

def criar_empresa(db: Session, dados: schemas.EmpresaCreate, current_user: User):
    if dados.nif:
        if db.query(models.Empresa).filter(models.Empresa.nif == dados.nif).first():
            raise HTTPException(400, "NIF já cadastrado")
    emp = models.Empresa(
        nome_fantasia=dados.nome_fantasia,
        cnpj=dados.cnpj,
        tipo=dados.tipo,
        nif=dados.nif,
        email=str(dados.email) if dados.email else None,
        phone=dados.phone,
        address=dados.address,
        city=dados.city,
        province=dados.province,
        iban=dados.iban,
        iban2=dados.iban2,
        banco1=dados.banco1,
        banco2=dados.banco2,
        logo_url=dados.logo_url,
        image_url=dados.image_url,
        tipo_agt=dados.tipo_agt,
        estado_agt=dados.estado_agt,
        inadimplente=dados.inadimplente,
        regime_iva=dados.regime_iva,
        residente_fiscal=dados.residente_fiscal,
    )
    db.add(emp); db.flush()
    vinc = UserEmpresa(user_id=current_user.id, empresa_id=emp.id, role=RoleEnum.DONO)
    db.add(vinc); db.flush()
    seed_perfis_por_tipo(db, emp.id, emp.tipo)
    db.commit(); db.refresh(emp)

    try:
        payload = {"id": str(emp.id), "nome_fantasia": emp.nome_fantasia, "tipo": str(emp.tipo), "nif": emp.nif, "logo_url": emp.logo_url}
        emit(str(emp.id), "empresa:created", data=payload)
        _broadcast_safe(emp.id, {"type": "empresa:created", "data": payload})
        _broadcast_safe(emp.id, {"type": "empresa:update", "data": payload})
    except: pass
    return emp

def listar_empresas_user(db: Session, user_id: UUID):
    vinc = db.query(UserEmpresa).filter(UserEmpresa.user_id == user_id).all()
    ids = [v.empresa_id for v in vinc]
    if not ids: return []
    return db.query(models.Empresa).filter(models.Empresa.id.in_(ids)).all()

def get_empresa(db: Session, empresa_id: UUID):
    emp = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not emp: raise HTTPException(404, "Empresa não encontrada")
    return emp

def atualizar_empresa(db: Session, empresa_id: UUID, dados: schemas.UpdateEmpresaRequest):
    emp = get_empresa(db, empresa_id)
    if dados.nif and dados.nif!= emp.nif:
        if db.query(models.Empresa).filter(models.Empresa.nif == dados.nif).first():
            raise HTTPException(400, "NIF já em uso")
    update_data = dados.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"]:
        update_data["email"] = str(update_data["email"])
    for k, v in update_data.items():
        setattr(emp, k, v)
    emp.updated_at = datetime.utcnow()
    db.commit(); db.refresh(emp)

    try:
        payload = {"id": str(emp.id), "nome_fantasia": emp.nome_fantasia, "logo_url": emp.logo_url, "image_url": emp.image_url, "email": emp.email}
        emit(str(empresa_id), "empresa:update", data=payload)
        _broadcast_safe(empresa_id, {"type": "empresa:update", "data": payload})
        if update_data.get("logo_url"):
            _broadcast_safe(empresa_id, {"type": "empresa:logo", "data": {"logo_url": emp.logo_url}})
    except: pass
    return emp

def deletar_empresa(db: Session, empresa_id: UUID):
    emp = get_empresa(db, empresa_id)
    db.delete(emp); db.commit()
    try:
        _broadcast_safe(empresa_id, {"type": "empresa:deleted", "data": {"id": str(empresa_id)}})
    except: pass
    return {"ok": True}

def vincular_usuario(db: Session, empresa_id: UUID, dados: schemas.VincularUsuarioRequest, current_user: User):
    dono = db.query(UserEmpresa).filter(UserEmpresa.user_id == current_user.id, UserEmpresa.empresa_id == empresa_id, UserEmpresa.role == RoleEnum.DONO).first()
    if not dono: raise HTTPException(403, "Só DONO pode vincular")
    user_alvo = db.query(User).filter(User.email == dados.email).first()
    if not user_alvo: raise HTTPException(404, "Usuário não existe, cadastre primeiro")
    if db.query(UserEmpresa).filter_by(user_id=user_alvo.id, empresa_id=empresa_id).first():
        raise HTTPException(400, "Já vinculado")
    try: role_enum = RoleEnum[dados.role.upper()]
    except: role_enum = RoleEnum.FUNCIONARIO
    vinc = UserEmpresa(user_id=user_alvo.id, empresa_id=empresa_id, role=role_enum)
    db.add(vinc); db.commit()
    payload = {"ok": True, "user_id": str(user_alvo.id), "role": str(role_enum), "email": str(dados.email)}
    try:
        emit(str(empresa_id), "usuario:vinculado", data=payload)
        _broadcast_safe(empresa_id, {"type": "usuario:vinculado", "data": payload})
        _broadcast_safe(empresa_id, {"type": "entidade:update", "data": {"acao": "vincular", "user_id": str(user_alvo.id)}})
    except: pass
    return payload

def atualizar_agt_info(db: Session, empresa_id: UUID, agt_data: dict):
    emp = get_empresa(db, empresa_id)
    emp.nif_agt_name = agt_data.get("nome_agt")
    emp.tipo_agt = agt_data.get("tipo")
    emp.estado_agt = agt_data.get("estado")
    emp.inadimplente = agt_data.get("inadimplente")
    emp.regime_iva = agt_data.get("regime_iva")
    emp.residente_fiscal = agt_data.get("residente_fiscal")
    emp.nif_verified = True
    emp.ultima_verificacao_agt = datetime.utcnow()
    db.commit(); db.refresh(emp)
    try:
        _broadcast_safe(empresa_id, {"type": "empresa:update", "data": {"id": str(emp.id), "nif_verified": True, "nif_agt_name": emp.nif_agt_name}})
    except: pass
    return emp
