from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.modules.empresa.models import Empresa, TipoEmpresaEnum
from jos_api.modules.empresa.perfis_models import Perfil # para seed
from jos_api.modules.empresa.seed import seed_perfis_por_tipo
from jos_api.core.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])

def ensure_superadmin(user: User):
    if not getattr(user, 'is_superadmin', False) and str(user.role).lower()!= "superadmin" and str(getattr(user, 'role_slug', '')).lower()!= "superadmin":
        raise HTTPException(status_code=403, detail=f"Só SUPERADMIN - teu role é {user.role}")
    return user

def _get_tipo_enum(tipo_str: str) -> TipoEmpresaEnum:
    try:
        return TipoEmpresaEnum(tipo_str)
    except:
        upper = tipo_str.upper()
        if upper in TipoEmpresaEnum.__members__:
            return TipoEmpresaEnum[upper]
        return TipoEmpresaEnum.RESTAURANTE

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

    tipo_enum = _get_tipo_enum(payload.tipo)

    # ---- 1. VALIDA / CRIA DONO SEM COMMITAR AINDA ----
    dono_obj: Optional[User] = None

    if payload.modoDono == "existente":
        if not payload.dono_existente_id:
            raise HTTPException(400, "Selecione dono existente")
        try:
            dono_uuid = uuid.UUID(payload.dono_existente_id)
        except:
            raise HTTPException(400, "ID dono inválido")
        dono_obj = db.query(User).filter(User.id == dono_uuid).first()
        if not dono_obj:
            raise HTTPException(404, "Dono não encontrado")

    elif payload.modoDono == "novo":
        if not payload.dono_novo:
            raise HTTPException(400, "Dados do novo dono obrigatórios")
        email_clean = payload.dono_novo.email.lower().strip()
        if db.query(User).filter(User.email.ilike(email_clean)).first():
            raise HTTPException(400, "Email do dono já existe")
        dono_obj = User(
            id=uuid.uuid4(),
            nome=payload.dono_novo.nome.strip(),
            email=email_clean,
            senha_hash=hash_password(payload.dono_novo.senha),
            role=RoleEnum.DONO,
            empresa_id=None # será setado depois que empresa existir
        )
        db.add(dono_obj)
        db.flush() # já tem ID

    else:
        raise HTTPException(400, "Modo dono inválido")

    # ---- 2. CRIA EMPRESA ----
    if payload.nif and db.query(Empresa).filter(Empresa.nif == payload.nif).first():
        raise HTTPException(400, "NIF já cadastrado")

    empresa = Empresa(
        id=uuid.uuid4(),
        nome_fantasia=payload.nome_fantasia.strip(),
        nif=payload.nif,
        tipo=tipo_enum,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        city=payload.city
    )
    db.add(empresa)
    db.flush()

    # ---- 3. FIX CRÍTICO QUE FALTAVA ----
    # A) Preenche users.empresa_id (que estava ficando NULL)
    # Se dono existente já tem empresa_id, não sobrescreve - mantém a primeira, mas se for NULL seta
    if dono_obj and getattr(dono_obj, 'empresa_id', None) is None:
        dono_obj.empresa_id = empresa.id

    # B) Cria vínculo em user_empresas (tabela principal de multi-empresa)
    ja_vinculado = db.query(UserEmpresa).filter(
        UserEmpresa.user_id == dono_obj.id,
        UserEmpresa.empresa_id == empresa.id
    ).first()
    if not ja_vinculado:
        vinc = UserEmpresa(
            user_id=dono_obj.id,
            empresa_id=empresa.id,
            role=RoleEnum.DONO
        )
        db.add(vinc)

    # C) Seed de perfis (se não fizer, o dono entra sem permissão)
    try:
        seed_perfis_por_tipo(db, empresa.id, empresa.tipo)
    except Exception as e:
        # não quebra criação se seed falhar
        print(f"Seed perfis falhou: {e}")

    db.commit()
    db.refresh(empresa)

    return {"ok": True, "id": str(empresa.id), "dono_id": str(dono_obj.id)}

@router.put("/empresas/{empresa_id}")
def update_empresa(empresa_id: str, payload: EmpresaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    try:
        emp_uuid = uuid.UUID(empresa_id)
    except:
        raise HTTPException(400, "ID empresa inválido")
    emp = db.query(Empresa).filter(Empresa.id == emp_uuid).first()
    if not emp:
        raise HTTPException(404, "Empresa não encontrada")

    emp.nome_fantasia = payload.nome_fantasia.strip()
    if payload.nif is not None: emp.nif = payload.nif
    if payload.email is not None: emp.email = payload.email
    if payload.phone is not None: emp.phone = payload.phone
    if payload.address is not None: emp.address = payload.address
    if payload.city is not None: emp.city = payload.city
    emp.tipo = _get_tipo_enum(payload.tipo)

    db.commit()
    return {"ok": True}

@router.delete("/empresas/{empresa_id}")
def delete_empresa(empresa_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_superadmin(current_user)
    try:
        emp_id = uuid.UUID(empresa_id)
    except:
        raise HTTPException(400, "ID inválido")
    emp = db.query(Empresa).filter(Empresa.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Não encontrada")

    # Limpa users.empresa_id que apontam pra ela
    db.query(User).filter(User.empresa_id == emp.id).update({User.empresa_id: None})
    db.query(UserEmpresa).filter(UserEmpresa.empresa_id == emp.id).delete()
    db.query(Perfil).filter(Perfil.empresa_id == emp.id).delete()
    db.delete(emp)
    db.commit()
    return {"ok": True}
