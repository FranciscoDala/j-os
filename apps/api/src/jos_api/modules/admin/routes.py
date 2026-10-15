from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.modules.empresa.models import Empresa, TipoEmpresaEnum
from jos_api.core.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])

def ensure_superadmin(user: User):
    # seu User já tem a property is_superadmin e role_slug
    if not user.is_superadmin and str(user.role).lower()!= "superadmin":
        raise HTTPException(status_code=403, detail=f"Só SUPERADMIN - teu role é {user.role}")
    return user

@router.get("/empresas")
def admin_list_empresas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    empresas = db.query(Empresa).order_by(Empresa.created_at.desc()).all()
    result = []
    for emp in empresas:
        vinc = db.query(UserEmpresa).filter(
            UserEmpresa.empresa_id == emp.id,
            UserEmpresa.role == RoleEnum.DONO
        ).first()
        if not vinc:
            vinc = db.query(UserEmpresa).filter(UserEmpresa.empresa_id == emp.id).first()

        dono = db.query(User).filter(User.id == vinc.user_id).first() if vinc else None

        result.append({
            "id": str(emp.id),
            "nome_fantasia": emp.nome_fantasia,
            "nif": emp.nif,
            "tipo": emp.tipo.value if hasattr(emp.tipo, 'value') else str(emp.tipo),
            "email": emp.email,
            "phone": emp.phone,
            "address": emp.address,
            "city": emp.city,
            "logo_url": emp.logo_url,
            "whatsapp_conectado": bool(emp.whatsapp_conectado),
            "nif_verified": bool(emp.nif_verified),
            "created_at": emp.created_at.isoformat() if emp.created_at else None,
            "dono": {
                "id": str(dono.id),
                "nome": dono.nome,
                "email": dono.email,
                "avatar_url": getattr(dono, 'avatar_url', None)
            } if dono else None
        })
    return result

@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    return {
        "total_empresas": db.query(Empresa).count(),
        "total_users": db.query(User).count(),
        "total_donos": db.query(UserEmpresa).filter(UserEmpresa.role == RoleEnum.DONO).count()
    }

@router.get("/donos")
def list_donos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    users = db.query(User).order_by(User.nome.asc()).all()
    return [{"id": str(u.id), "nome": u.nome, "email": u.email} for u in users]

# ---- Schemas para modal ----
class DonoNovo(BaseModel):
    nome: str
    email: str
    senha: str
    telefone: Optional[str] = None

class EmpresaCreate(BaseModel):
    nome_fantasia: str
    nif: Optional[str] = None
    tipo: str = "RESTAURANTE"
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    modoDono: str = "existente"
    dono_existente_id: Optional[str] = None
    dono_novo: Optional[DonoNovo] = None

@router.post("/empresas")
def create_empresa(payload: EmpresaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)

    # corrige tipo - seu enum é TipoEmpresaEnum
    try:
        tipo_enum = TipoEmpresaEnum(payload.tipo)
    except:
        # fallback
        tipo_enum = TipoEmpresaEnum.RESTAURANTE
        if payload.tipo.upper() in TipoEmpresaEnum.__members__:
            tipo_enum = TipoEmpresaEnum[payload.tipo.upper()]

    empresa = Empresa(
        id=uuid.uuid4(),
        nome_fantasia=payload.nome_fantasia,
        nif=payload.nif,
        tipo=tipo_enum,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        city=payload.city
    )
    db.add(empresa)
    db.flush()

    dono_id = None
    if payload.modoDono == "existente" and payload.dono_existente_id:
        dono_id = uuid.UUID(payload.dono_existente_id)
    elif payload.modoDono == "novo" and payload.dono_novo:
        # seu User usa senha_hash e não tem telefone no model
        novo = User(
            id=uuid.uuid4(),
            nome=payload.dono_novo.nome,
            email=payload.dono_novo.email.lower().strip(),
            senha_hash=hash_password(payload.dono_novo.senha),
            role=RoleEnum.DONO
        )
        db.add(novo)
        db.flush()
        dono_id = novo.id
    else:
        raise HTTPException(status_code=400, detail="Selecione dono existente ou crie novo")

    vinc = UserEmpresa(user_id=dono_id, empresa_id=empresa.id, role=RoleEnum.DONO)
    db.add(vinc)
    db.commit()
    return {"ok": True, "id": str(empresa.id)}

@router.put("/empresas/{empresa_id}")
def update_empresa(empresa_id: str, payload: EmpresaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    emp = db.query(Empresa).filter(Empresa.id == uuid.UUID(empresa_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    emp.nome_fantasia = payload.nome_fantasia
    if payload.nif: emp.nif = payload.nif
    if payload.email: emp.email = payload.email
    if payload.phone: emp.phone = payload.phone
    if payload.address: emp.address = payload.address
    if payload.city: emp.city = payload.city

    try:
        emp.tipo = TipoEmpresaEnum(payload.tipo)
    except:
        pass

    db.commit()
    return {"ok": True}

@router.delete("/empresas/{empresa_id}")
def delete_empresa(empresa_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    emp_id = uuid.UUID(empresa_id)
    emp = db.query(Empresa).filter(Empresa.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Não encontrada")

    db.query(UserEmpresa).filter(UserEmpresa.empresa_id == emp.id).delete()
    db.delete(emp)
    db.commit()
    return {"ok": True}
