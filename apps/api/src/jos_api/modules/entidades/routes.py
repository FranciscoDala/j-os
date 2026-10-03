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
    # tenta pegar slug do perfil vinculado à entidade do usuário
    try:
        ent = db.query(models.Entidade).filter(models.Entidade.user_id == user.id, models.Entidade.empresa_id == empresa_id).first()
        if ent and ent.perfil_id:
            perfil = db.query(Perfil).filter(Perfil.id == ent.perfil_id).first()
            if perfil:
                return str(perfil.slug).lower()
    except Exception:
        pass
    role = getattr(user, 'role', None)
    if not role: return "dono" # fallback pra não dar "Usuário não encontrado"
    return str(role.value if isinstance(role, enum.Enum) else role).lower()

def _seed_perfis(db: Session, empresa_id: UUID):
    # verifica se já tem
    existing = db.query(Perfil).filter(Perfil.empresa_id == empresa_id).all()
    if existing:
        return existing

    padroes = [
        {"nome": "Dono", "slug": "dono"},
        {"nome": "Gerente Restaurante", "slug": "gerente_restaurante"},
        {"nome": "Operador de Caixa", "slug": "operador_caixa"},
        {"nome": "Caixa", "slug": "caixa"},
        {"nome": "Garçom", "slug": "garcom"},
        {"nome": "Vigilante", "slug": "vigilante"},
        {"nome": "RH", "slug": "rh"},
    ]
    try:
        for p in padroes:
            # só cria se não existir, sem campo ativo pra não quebrar
            db.add(Perfil(empresa_id=empresa_id, nome=p["nome"], slug=p["slug"], descricao=p["nome"], permissoes={}))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[SEED ERRO] {e}")
        # tenta sem permissoes
        try:
            for p in padroes:
                if not db.query(Perfil).filter_by(empresa_id=empresa_id, slug=p["slug"]).first():
                    db.add(Perfil(empresa_id=empresa_id, nome=p["nome"], slug=p["slug"]))
            db.commit()
        except Exception as e2:
            db.rollback()
            print(f"[SEED ERRO 2] {e2}")

    return db.query(Perfil).filter(Perfil.empresa_id == empresa_id).all()

@router.get("/{empresa_id}/perfis", response_model=list[schemas.PerfilOut])
def listar_perfis(empresa_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _seed_perfis(db, empresa_id)

@router.post("/{empresa_id}", response_model=schemas.EntidadeOut)
def criar_entidade(empresa_id: UUID, dados: schemas.EntidadeCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_slug = _get_user_role_slug(db, current_user, empresa_id)
    check_permission(role_slug, "restaurante:entidade:create")

    nome_norm = dados.nome.strip()
    email_norm = (dados.email or "").strip() or None
    senha_norm = (dados.senha or "").strip() or None

    # regra cliente
    if dados.tipo == models.TipoEntidadeEnum.CLIENTE:
        dados.tem_acesso_app = False

    # se não tem acesso, zera perfil/senha DEPOIS da validação
    tem_acesso = bool(dados.tem_acesso_app) and dados.tipo == models.TipoEntidadeEnum.FUNCIONARIO

    if tem_acesso:
        if not dados.perfil_id:
            raise HTTPException(400, "Selecione o perfil de acesso")
        if not email_norm:
            raise HTTPException(400, "Email obrigatório para acesso")
        if not senha_norm or len(senha_norm) < 6:
            raise HTTPException(400, "Senha mínima 6 caracteres")

    user_id = None
    perfil_id_final = dados.perfil_id if tem_acesso else None

    if tem_acesso:
        perfil = db.query(Perfil).filter(Perfil.id == dados.perfil_id, Perfil.empresa_id == empresa_id).first()
        if not perfil:
            raise HTTPException(404, "Perfil não encontrado")

        existing_user = db.query(User).filter(User.email == email_norm).first()
        if existing_user:
            user_id = existing_user.id
            if not db.query(UserEmpresa).filter_by(user_id=existing_user.id, empresa_id=empresa_id).first():
                db.add(UserEmpresa(user_id=existing_user.id, empresa_id=empresa_id, role=perfil.slug))
        else:
            assert senha_norm is not None
            novo_user = User(nome=nome_norm, email=email_norm, senha_hash=hash_password(senha_norm), role=perfil.slug, empresa_id=empresa_id)
            db.add(novo_user)
            db.flush()
            user_id = novo_user.id
            db.add(UserEmpresa(user_id=novo_user.id, empresa_id=empresa_id, role=perfil.slug))

    ent = models.Entidade(
        empresa_id=empresa_id, tipo=dados.tipo, nome=nome_norm,
        telefone=(dados.telefone or "").strip() or None, email=email_norm,
        documento=(dados.documento or "").strip() or None, endereco=(dados.endereco or "").strip() or None,
        cargo=(dados.cargo or "").strip() or None, departamento=(dados.departamento or "").strip() or None,
        salario=dados.salario, carga_horaria=dados.carga_horaria, data_admissao=dados.data_admissao,
        empresa_fornecedora=(dados.empresa_fornecedora or "").strip() or None, categoria_fornecedor=(dados.categoria_fornecedor or "").strip() or None,
        tem_acesso_app=tem_acesso, perfil_id=perfil_id_final, user_id=user_id
    )
    db.add(ent)
    db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="ENTIDADE", acao="CRIAR", descricao=f"Criou {dados.tipo} '{nome_norm}'", entidade="Entidade", entidade_id=ent.id, entidade_nome=nome_norm, user_id=current_user.id, user_nome=getattr(current_user, 'nome', 'Sistema'), ip=_get_ip(request), commit=False)
    db.commit()
    db.refresh(ent)
    emit(str(empresa_id), "entidade:created", data={"id": str(ent.id), "tipo": str(ent.tipo), "nome": ent.nome})
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
    return {"message": "Apagado"}
