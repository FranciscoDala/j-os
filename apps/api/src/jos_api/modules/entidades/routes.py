from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.modules.empresa.perfis_models import Perfil
from jos_api.core.security import hash_password
from. import models, schemas
from jos_api.modules.atividade.service import registrar_atividade

router = APIRouter(prefix="/entidades", tags=["entidades"])

def _get_ip(request: Request): return request.client.host if request.client else None

@router.post("/{empresa_id}", response_model=schemas.EntidadeOut)
def criar_entidade(empresa_id: UUID, dados: schemas.EntidadeCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if dados.tipo == models.TipoEntidadeEnum.CLIENTE:
        dados.tem_acesso_app = False; dados.perfil_id = None; dados.senha = None
    if not dados.tem_acesso_app: dados.perfil_id = None; dados.senha = None
    if dados.tipo == models.TipoEntidadeEnum.FUNCIONARIO and dados.tem_acesso_app:
        if not dados.perfil_id: raise HTTPException(400, "Funcionário com acesso precisa de um perfil")
        if not dados.email: raise HTTPException(400, "Funcionário com acesso precisa de email")
        if not dados.senha or len(dados.senha) < 6: raise HTTPException(400, "Senha min 6 caracteres")
    user_id = None
    if dados.tem_acesso_app and dados.tipo == models.TipoEntidadeEnum.FUNCIONARIO:
        perfil = db.query(Perfil).filter(Perfil.id == dados.perfil_id, Perfil.empresa_id == empresa_id).first()
        if not perfil: raise HTTPException(404, "Perfil não encontrado nessa empresa")
        role_para_user = RoleEnum.DONO if perfil.slug == "dono" else RoleEnum.FUNCIONARIO
        existing_user = db.query(User).filter(User.email == dados.email).first()
        if existing_user:
            user_id = existing_user.id
            vinc = db.query(UserEmpresa).filter_by(user_id=existing_user.id, empresa_id=empresa_id).first()
            if not vinc: db.add(UserEmpresa(user_id=existing_user.id, empresa_id=empresa_id, role=role_para_user))
        else:
            senha_limpa = (dados.senha or "").strip()
            novo_user = User(nome=dados.nome, email=dados.email, senha_hash=hash_password(senha_limpa), role=role_para_user, empresa_id=empresa_id)
            db.add(novo_user); db.flush(); user_id = novo_user.id
            db.add(UserEmpresa(user_id=novo_user.id, empresa_id=empresa_id, role=role_para_user))
    ent = models.Entidade(empresa_id=empresa_id, tipo=dados.tipo, nome=dados.nome, telefone=dados.telefone, email=dados.email, documento=dados.documento, tem_acesso_app=dados.tem_acesso_app, perfil_id=dados.perfil_id, user_id=user_id)
    db.add(ent); db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="ENTIDADE", acao="CRIAR", descricao=f"Criou {dados.tipo.value} '{dados.nome}'", entidade="Entidade", entidade_id=ent.id, entidade_nome=dados.nome, user_id=current_user.id, user_nome=getattr(current_user, 'nome', 'Sistema'), detalhes={"tipo": dados.tipo.value, "email": dados.email}, ip=_get_ip(request), commit=False)
    db.commit(); db.refresh(ent); return ent

@router.get("/{empresa_id}", response_model=list[schemas.EntidadeOut])
def listar_entidades(empresa_id: UUID, tipo: models.TipoEntidadeEnum | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(models.Entidade).filter(models.Entidade.empresa_id == empresa_id, models.Entidade.ativo == True)
    if tipo: q = q.filter(models.Entidade.tipo == tipo)
    return q.all()

@router.delete("/{empresa_id}/{entidade_id}")
def deletar_entidade(empresa_id: UUID, entidade_id: UUID, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ent = db.query(models.Entidade).filter(models.Entidade.id == entidade_id, models.Entidade.empresa_id == empresa_id).first()
    if not ent: raise HTTPException(404, "Entidade não encontrada")
    nome_guardado = ent.nome; tipo_guardado = ent.tipo.value
    ent.ativo = False; db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="ENTIDADE", acao="DELETAR", descricao=f"Apagou {tipo_guardado} '{nome_guardado}'", entidade="Entidade", entidade_id=ent.id, entidade_nome=nome_guardado, user_id=current_user.id, user_nome=getattr(current_user, 'nome', 'Sistema'), detalhes={"tipo": tipo_guardado, "email": ent.email}, ip=_get_ip(request), commit=False)
    db.commit()
    return {"message": f"{tipo_guardado} '{nome_guardado}' apagado"}

@router.get("/{empresa_id}/perfis")
def listar_perfis(empresa_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Perfil).filter(Perfil.empresa_id == empresa_id).all()
