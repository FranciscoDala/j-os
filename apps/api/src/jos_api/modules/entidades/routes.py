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
    if isinstance(role, str):
        return role.lower()
    if isinstance(role, enum.Enum):
        try:
            return str(role.value).lower()
        except Exception:
            return str(role).lower()
    return str(role).lower()

# <<< TEM QUE VIR ANTES DE /{empresa_id} >>>
@router.get("/{empresa_id}/perfis", response_model=list[schemas.PerfilOut])
def listar_perfis(empresa_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print(f"[PERFIS] Buscando perfis para empresa {empresa_id}")
    perfis = db.query(Perfil).filter(Perfil.empresa_id == empresa_id).all()
    print(f"[PERFIS] Encontrados: {len(perfis)}")
    if not perfis:
        print("[PERFIS] Criando perfis padrão...")
        padroes = [
            {"nome": "Dono", "slug": "dono", "descricao": "Acesso total", "permissoes": {"all": True}},
            {"nome": "Gerente Restaurante", "slug": "gerente_restaurante", "descricao": "Gerencia tudo", "permissoes": {"vendas": True}},
            {"nome": "Operador de Caixa", "slug": "operador_caixa", "descricao": "Opera caixa e vendas", "permissoes": {"vendas": True, "caixa_operar": True}},
            {"nome": "Caixa", "slug": "caixa", "descricao": "Só opera caixa", "permissoes": {"caixa_operar": True}},
            {"nome": "Garçom", "slug": "garcom", "descricao": "Cria pedidos", "permissoes": {"vendas": True}},
            {"nome": "Vigilante", "slug": "vigilante", "descricao": "Visualização", "permissoes": {"view_only": True}},
            {"nome": "RH", "slug": "rh", "descricao": "Gerencia funcionários", "permissoes": {"entidades": True}},
        ]
        for p in padroes:
            exists = db.query(Perfil).filter(Perfil.empresa_id == empresa_id, Perfil.slug == p["slug"]).first()
            if not exists:
                db.add(Perfil(empresa_id=empresa_id, **p))
        db.commit()
        perfis = db.query(Perfil).filter(Perfil.empresa_id == empresa_id).all()
        print(f"[PERFIS] Após seed: {len(perfis)}")
    return perfis

@router.post("/{empresa_id}", response_model=schemas.EntidadeOut)
def criar_entidade(empresa_id: UUID, dados: schemas.EntidadeCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_slug = _get_user_role_slug(db, current_user, empresa_id)
    check_permission(role_slug, "restaurante:entidade:create")

    # Normaliza strings pra evitar None.strip()
    email_norm = str(dados.email or "").strip() or None
    senha_norm = str(dados.senha or "").strip() or None
    nome_norm = str(dados.nome or "").strip()

    if dados.tipo == models.TipoEntidadeEnum.CLIENTE:
        dados.tem_acesso_app = False
        dados.perfil_id = None
        dados.senha = None
        senha_norm = None

    if not dados.tem_acesso_app:
        dados.perfil_id = None
        dados.senha = None
        senha_norm = None

    if dados.tipo == models.TipoEntidadeEnum.FUNCIONARIO and dados.tem_acesso_app:
        if not dados.perfil_id:
            raise HTTPException(400, "Funcionário com acesso precisa de um perfil")
        if not email_norm:
            raise HTTPException(400, "Funcionário com acesso precisa de email")
        if not senha_norm or len(senha_norm) < 6:
            raise HTTPException(400, "Senha min 6 caracteres")

    user_id = None
    if dados.tem_acesso_app and dados.tipo == models.TipoEntidadeEnum.FUNCIONARIO:
        perfil = db.query(Perfil).filter(Perfil.id == dados.perfil_id, Perfil.empresa_id == empresa_id).first()
        if not perfil:
            raise HTTPException(404, "Perfil não encontrado nessa empresa")

        existing_user = db.query(User).filter(User.email == email_norm).first()
        if existing_user:
            user_id = existing_user.id
            vinc = db.query(UserEmpresa).filter_by(user_id=existing_user.id, empresa_id=empresa_id).first()
            if not vinc:
                db.add(UserEmpresa(user_id=existing_user.id, empresa_id=empresa_id, role=perfil.slug))
        else:
            # senha_norm já garantido com min 6 acima
            novo_user = User(
                nome=nome_norm,
                email=email_norm,
                senha_hash=hash_password(senha_norm or ""),
                role=perfil.slug,
                empresa_id=empresa_id
            )
            db.add(novo_user)
            db.flush()
            user_id = novo_user.id
            db.add(UserEmpresa(user_id=novo_user.id, empresa_id=empresa_id, role=perfil.slug))

    ent = models.Entidade(
        empresa_id=empresa_id,
        tipo=dados.tipo,
        nome=nome_norm,
        telefone=str(dados.telefone or "").strip() or None,
        email=email_norm,
        documento=str(dados.documento or "").strip() or None,
        endereco=str(dados.endereco or "").strip() or None,
        cargo=str(dados.cargo or "").strip() or None,
        departamento=str(dados.departamento or "").strip() or None,
        salario=dados.salario,
        carga_horaria=dados.carga_horaria,
        data_admissao=dados.data_admissao,
        empresa_fornecedora=str(dados.empresa_fornecedora or "").strip() or None,
        categoria_fornecedor=str(dados.categoria_fornecedor or "").strip() or None,
        tem_acesso_app=bool(dados.tem_acesso_app),
        perfil_id=dados.perfil_id,
        user_id=user_id
    )
    db.add(ent)
    db.flush()
    registrar_atividade(
        db, empresa_id=empresa_id, modulo="ENTIDADE", acao="CRIAR",
        descricao=f"Criou {dados.tipo} '{nome_norm}'",
        entidade="Entidade", entidade_id=ent.id, entidade_nome=nome_norm,
        user_id=current_user.id, user_nome=getattr(current_user, 'nome', 'Sistema'),
        ip=_get_ip(request), commit=False
    )
    db.commit()
    db.refresh(ent)
    emit(str(empresa_id), "entidade:created", data={"id": str(ent.id), "tipo": str(ent.tipo), "nome": ent.nome})
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
    ent.ativo = False
    db.commit()
    emit(str(empresa_id), "entidade:deleted", data={"id": str(entidade_id)})
    return {"message": "Apagado"}
