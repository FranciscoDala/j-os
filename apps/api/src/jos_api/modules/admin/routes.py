from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.modules.empresa.models import Empresa

router = APIRouter(prefix="/admin", tags=["admin"])

def ensure_superadmin(user: User):
    if user.role_slug!= "superadmin":
        from fastapi import HTTPException
        raise HTTPException(403, "Só SUPERADMIN")
    return user

@router.get("/empresas")
def admin_list_empresas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    empresas = db.query(Empresa).order_by(Empresa.created_at.desc()).all()
    result = []
    for emp in empresas:
        # pega o DONO
        dono_vinc = db.query(UserEmpresa).filter(
            UserEmpresa.empresa_id == emp.id,
            UserEmpresa.role == RoleEnum.DONO
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
            "whatsapp_conectado": emp.whatsapp_conectado,
            "nif_verified": emp.nif_verified,
            "created_at": emp.created_at,
            "dono": {
                "id": str(dono.id) if dono else None,
                "nome": dono.nome if dono else "Sem dono",
                "email": dono.email if dono else None,
                "avatar_url": dono.avatar_url if dono else None,
            } if dono else None
        })
    return result
