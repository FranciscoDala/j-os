from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
import enum
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User, UserEmpresa
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
    ent = db.query(models.Entidade).filter(
        models.Entidade.user_id == user.id,
        models.Entidade.empresa_id == empresa_id
    ).first()
    if ent and ent.perfil_id:
        perfil = db.query(Perfil).filter(Perfil.id == ent.perfil_id).first()
        if perfil and getattr(perfil, 'slug', None):
            return str(perfil.slug).lower()

    role = getattr(user, 'role', None)
    if role is None:
        return "funcionario"
    # se for string já retorna
    if isinstance(role, str):
        return role.lower()
    # se for Enum
    if isinstance(role, enum.Enum):
        try:
            return str(role.value).lower()
        except Exception:
            return str(role).lower()
    # fallback
    return str(role).lower()

@router.post("/{empresa_id}", response_model=schemas.EntidadeOut)
def criar_entidade(empresa_id: UUID, dados: schemas.EntidadeCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_slug = _get_user_role_slug(db, current_user, empresa_id)
    check_permission(role_slug, "restaurante:entidade:create")

    if dados.tipo == models.TipoEntidadeEnum.CLIENTE:
        dados.tem_acesso_app = False
        dados.perfil_id = None
        dados.senha = None
        dados.cargo = None
        dados.salario = None
        dados.carga_horaria = None

    if not dados.tem_acesso_app:
        dados.perfil_id = None
        dados.senha = None

    if dados.tipo == models.TipoEntidadeEnum.FUNCIONARIO and dados.tem_acesso_app:
        if not dados.perfil_id: raise HTTPException(400, "Funcionário com acesso precisa de um perfil")
        if not dados.email: raise HTTPException(400, "Funcionário com acesso precisa de email")
        if not dados.senha or len(dados.senha.strip()) < 6: raise HTTPException(400, "Senha min 6 caracteres")

    user_id = None
    if dados.tem_acesso_app and dados.tipo == models.TipoEntidadeEnum.FUNCIONARIO:
        perfil = db.query(Perfil).filter(Perfil.id == dados.perfil_id, Perfil.empresa_id == empresa_id).first()
        if not perfil: raise HTTPException(404, "Perfil não encontrado nessa empresa")
        existing_user = db.query(User).filter(User.email == dados.email).first()
        if existing_user:
            user_id = existing_user.id
            vinc = db.query(UserEmpresa).filter_by(user_id=existing_user.id, empresa_id=empresa_id).first()
            if not vinc:
                db.add(UserEmpresa(user_id=existing_user.id, empresa_id=empresa_id, role=perfil.slug))
        else:
            senha_limpa = (dados.senha or "").strip()
            novo_user = User(nome=dados.nome, email=dados.email, senha_hash=hash_password(senha_limpa), role=perfil.slug, empresa_id=empresa_id)
            db.add(novo_user)
            db.flush()
            user_id = novo_user.id
            db.add(UserEmpresa(user_id=novo_user.id, empresa_id=empresa_id, role=perfil.slug))

    ent = models.Entidade(
        empresa_id=empresa_id, tipo=dados.tipo, nome=dados.nome, telefone=dados.telefone, email=dados.email,
        documento=dados.documento, endereco=dados.endereco, cargo=dados.cargo, departamento=dados.departamento,
        salario=dados.salario, carga_horaria=dados.carga_horaria, data_admissao=dados.data_admissao,
        empresa_fornecedora=dados.empresa_fornecedora, categoria_fornecedor=dados.categoria_fornecedor,
        tem_acesso_app=dados.tem_acesso_app, perfil_id=dados.perfil_id, user_id=user_id
    )
    db.add(ent)
    db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="ENTIDADE", acao="CRIAR", descricao=f"Criou {dados.tipo} '{dados.nome}'", entidade="Entidade", entidade_id=ent.id, entidade_nome=dados.nome, user_id=current_user.id, user_nome=getattr(current_user, 'nome', 'Sistema'), detalhes={"tipo": str(dados.tipo), "email": dados.email, "cargo": dados.cargo}, ip=_get_ip(request), commit=False)
    db.commit()
    db.refresh(ent)
    emit(str(empresa_id), "entidade:created", data={"id": str(ent.id), "tipo": str(dados.tipo), "nome": ent.nome, "email": ent.email, "telefone": ent.telefone, "cargo": ent.cargo, "perfil_id": str(ent.perfil_id) if ent.perfil_id else None})
    return ent

@router.get("/{empresa_id}", response_model=list[schemas.EntidadeOut])
def listar_entidades(empresa_id: UUID, tipo: models.TipoEntidadeEnum | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_slug = _get_user_role_slug(db, current_user, empresa_id)
    check_permission(role_slug, "restaurante:entidade:read")
    q = db.query(models.Entidade).filter(models.Entidade.empresa_id == empresa_id, models.Entidade.ativo == True)
    if tipo:
        q = q.filter(models.Entidade.tipo == tipo)
    return q.order_by(models.Entidade.created_at.desc()).all()

@router.delete("/{empresa_id}/{entidade_id}")
def deletar_entidade(empresa_id: UUID, entidade_id: UUID, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_slug = _get_user_role_slug(db, current_user, empresa_id)
    check_permission(role_slug, "restaurante:entidade:delete")
    ent = db.query(models.Entidade).filter(models.Entidade.id == entidade_id, models.Entidade.empresa_id == empresa_id).first()
    if not ent: raise HTTPException(404, "Entidade não encontrada")
    nome_guardado = ent.nome
    tipo_guardado = str(ent.tipo)
    ent.ativo = False
    db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="ENTIDADE", acao="DELETAR", descricao=f"Apagou {tipo_guardado} '{nome_guardado}'", entidade="Entidade", entidade_id=ent.id, entidade_nome=nome_guardado, user_id=current_user.id, user_nome=getattr(current_user, 'nome', 'Sistema'), detalhes={"tipo": tipo_guardado, "email": ent.email}, ip=_get_ip(request), commit=False)
    db.commit()
    emit(str(empresa_id), "entidade:deleted", data={"id": str(entidade_id), "tipo": tipo_guardado})
    return {"message": f"{tipo_guardado} '{nome_guardado}' apagado"}

@router.get("/{empresa_id}/perfis")
def listar_perfis(empresa_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Perfil).filter(Perfil.empresa_id == empresa_id).all()
