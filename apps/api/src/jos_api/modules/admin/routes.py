from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.modules.empresa.models import Empresa

router = APIRouter(prefix="/admin", tags=["admin"])

def ensure_superadmin(user: User):
    slug = str(getattr(user, 'role_slug', '') or '').lower()
    role = str(getattr(user, 'role', '') or '').lower()
    # aceita superadmin em qualquer formato
    if slug!= "superadmin" and role!= "superadmin" and role!= str(RoleEnum.SUPERADMIN).lower():
        # tenta pelo enum direto
        if getattr(user, 'role', None)!= RoleEnum.SUPERADMIN:
            raise HTTPException(status_code=403, detail=f"Só SUPERADMIN - teu role é {user.role}/{user.role_slug}")
    return user

@router.get("/empresas")
def admin_list_empresas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    empresas = db.query(Empresa).order_by(Empresa.created_at.desc()).all()
    result = []
    for emp in empresas:
        dono_vinc = db.query(UserEmpresa).filter(
            UserEmpresa.empresa_id == emp.id,
            UserEmpresa.role == RoleEnum.DONO
        ).first()
        # fallback se não achar por DONO, pega primeiro vínculo
        if not dono_vinc:
            dono_vinc = db.query(UserEmpresa).filter(
                UserEmpresa.empresa_id == emp.id
            ).first()

        dono = None
        if dono_vinc:
            dono = db.query(User).filter(User.id == dono_vinc.user_id).first()

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
                "id": str(dono.id) if dono else None,
                "nome": dono.nome if dono else "Sem dono",
                "email": dono.email if dono else None,
                "avatar_url": getattr(dono, 'avatar_url', None) if dono else None,
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
