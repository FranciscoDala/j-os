from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
import enum
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user, get_perfil_atual, precisa_permissao
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.modules.empresa.perfis_models import Perfil
from jos_api.core.security import hash_password
from jos_api.core.permissions import check_permission
from. import models, schemas
from jos_api.modules.atividade.service import registrar_atividade
from jos_api.core.events import emit

router = APIRouter(prefix="/entidades", tags=["entidades"])

def _get_ip(request: Request):
    return request.client.host if request.client else None

def _get_user_role_slug(db: Session, user: User, empresa_id: UUID) -> str:
    try:
        ent = db.query(models.Entidade).filter(models.Entidade.user_id == user.id, models.Entidade.empresa_id == empresa_id).first()
        if ent and ent.perfil_id:
            perfil_q = db.query(Perfil).filter(Perfil.id == ent.perfil_id).first()
            if perfil_q and getattr(perfil_q, 'role_equivalente', None):
                return str(perfil_q.role_equivalente.value).lower()
            if perfil_q and getattr(perfil_q, 'slug', None):
                return str(perfil_q.slug).lower()
    except Exception:
        pass
    role = getattr(user, 'role', None)
    if not role:
        return "dono"
    return str(role.value if isinstance(role, enum.Enum) else role).lower()

@router.get("/{empresa_id}/perfis", response_model=list[schemas.PerfilOut])
def listar_perfis(empresa_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Usa seed por tipo da empresa
    from jos_api.modules.empresa.models import Empresa, TipoEmpresaEnum
    from jos_api.modules.empresa.seed import seed_perfis_por_tipo
    emp = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if emp:
        seed_perfis_por_tipo(db, empresa_id, emp.tipo)
        db.commit()
    return db.query(Perfil).filter(Perfil.empresa_id == empresa_id).all()

@router.post("/{empresa_id}", response_model=schemas.EntidadeOut)
def criar_entidade(empresa_id: UUID, dados: schemas.EntidadeCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_slug = _get_user_role_slug(db, current_user, empresa_id)
    check_permission(role_slug, "restaurante:entidade:create")

    nome_norm = str(dados.nome or "").strip()
    email_norm = str(dados.email or "").strip().lower() or None
    senha_norm = str(dados.senha or "").strip() or None

    if dados.tipo == models.TipoEntidadeEnum.CLIENTE:
        dados.tem_acesso_app = False
    tem_acesso = bool(dados.tem_acesso_app) and dados.tipo == models.TipoEntidadeEnum.FUNCIONARIO

    if tem_acesso:
        if not dados.perfil_id: raise HTTPException(400, "Selecione o perfil")
        if not email_norm: raise HTTPException(400, "Email obrigatório")
        if not senha_norm or len(senha_norm) < 6: raise HTTPException(400, "Senha mínima 6")

    user_id = None

    if tem_acesso:
        perfil_obj = db.query(Perfil).filter(Perfil.id == dados.perfil_id, Perfil.empresa_id == empresa_id).first()
        if not perfil_obj:
            perfil_obj = db.query(Perfil).filter(Perfil.id == dados.perfil_id).first()
            if not perfil_obj: raise HTTPException(404, "Perfil não encontrado")

        # FIX PROFISSIONAL - Usa role_equivalente do Perfil, não FUNCIONARIO fixo
        role_final = getattr(perfil_obj, 'role_equivalente', None) or RoleEnum.FUNCIONARIO
        if isinstance(role_final, str):
            try: role_final = RoleEnum(role_final.lower())
            except: role_final = RoleEnum.FUNCIONARIO

        existing_user = db.query(User).filter(User.email == email_norm).first()

        if existing_user:
            user_id = existing_user.id
            # Atualiza role do user para bater com perfil
            existing_user.role = role_final
            vinc = db.query(UserEmpresa).filter_by(user_id=existing_user.id, empresa_id=empresa_id).first()
            if vinc:
                vinc.role = role_final
            else:
                db.add(UserEmpresa(user_id=existing_user.id, empresa_id=empresa_id, role=role_final))
        else:
            assert email_norm is not None
            assert senha_norm is not None
            novo_user = User(
                id=uuid4(),
                nome=nome_norm,
                email=email_norm,
                senha_hash=hash_password(senha_norm),
                role=role_final,
                empresa_id=empresa_id,
                ativo=True
            )
            
            db.add(novo_user)
            db.flush()
            user_id = novo_user.id
            db.add(UserEmpresa(user_id=novo_user.id, empresa_id=empresa_id, role=role_final))

    ent = models.Entidade(
        empresa_id=empresa_id, tipo=dados.tipo, nome=nome_norm,
        telefone=str(dados.telefone or "").strip() or None, email=email_norm,
        documento=str(dados.documento or "").strip() or None, endereco=str(dados.endereco or "").strip() or None,
        cargo=str(dados.cargo or "").strip() or None, departamento=str(dados.departamento or "").strip() or None,
        salario=dados.salario, carga_horaria=dados.carga_horaria, data_admissao=dados.data_admissao,
        empresa_fornecedora=str(dados.empresa_fornecedora or "").strip() or None, categoria_fornecedor=str(dados.categoria_fornecedor or "").strip() or None,
        tem_acesso_app=tem_acesso, perfil_id=dados.perfil_id if tem_acesso else None, user_id=user_id
    )
    db.add(ent)
    db.flush()
    try:
        registrar_atividade(db, empresa_id=empresa_id, modulo="ENTIDADE", acao="CRIAR", descricao=f"Criou {dados.tipo} '{nome_norm}'", entidade="Entidade", entidade_id=ent.id, entidade_nome=nome_norm, user_id=current_user.id, user_nome=getattr(current_user, 'nome', 'Sistema'), ip=_get_ip(request), commit=False)
    except: pass
    db.commit()
    db.refresh(ent)
    try: emit(str(empresa_id), "entidade:created", data={"id": str(ent.id), "tipo": str(ent.tipo), "nome": ent.nome})
    except: pass
    return ent

@router.get("/{empresa_id}", response_model=list[schemas.EntidadeOut])
def listar_entidades(empresa_id: UUID, tipo: models.TipoEntidadeEnum | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_slug = _get_user_role_slug(db, current_user, empresa_id)
    check_permission(role_slug, "restaurante:entidade:read")
    q = db.query(models.Entidade).filter(models.Entidade.empresa_id == empresa_id, models.Entidade.ativo == True)
    if tipo: q = q.filter(models.Entidade.tipo == tipo)
    return q.order_by(models.Entidade.created_at.desc()).all()

@router.delete("/{empresa_id}/{entidade_id}")
def deletar_entidade(empresa_id: UUID, entidade_id: UUID, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_slug = _get_user_role_slug(db, current_user, empresa_id)
    check_permission(role_slug, "restaurante:entidade:delete")
    ent = db.query(models.Entidade).filter(models.Entidade.id == entidade_id, models.Entidade.empresa_id == empresa_id).first()
    if not ent: raise HTTPException(404, "Entidade não encontrada")
    ent.ativo = False
    db.commit()
    try: emit(str(empresa_id), "entidade:deleted", data={"id": str(entidade_id)})
    except: pass
    return {"message": "Apagado"}
