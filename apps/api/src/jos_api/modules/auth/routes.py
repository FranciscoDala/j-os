from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from. import schemas, service
from.models import User
from jos_api.modules.empresa.models import Empresa

router = APIRouter(prefix="/auth", tags=["auth"])

def _get_ip(request: Request) -> str | None:
    return request.client.host if request.client else None

@router.post("/register", response_model=schemas.UserOut)
def register(dados: schemas.UserCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.criar_usuario(db, dados, criado_por_id=current_user.id, criado_por_nome=getattr(current_user, 'nome', 'Sistema'), ip=_get_ip(request))

@router.post("/login", response_model=schemas.LoginResponse)
def login(dados: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    return service.autenticar(db, dados, ip=_get_ip(request))

@router.post("/select-empresa", response_model=schemas.LoginResponse)
def select_empresa(dados: schemas.SelectEmpresaRequest, request: Request, db: Session = Depends(get_db)):
    return service.selecionar_empresa(db, dados, ip=_get_ip(request))

@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    empresa = None
    if current_user.empresa_id:
        empresa = db.query(Empresa).filter(Empresa.id == current_user.empresa_id).first()
    return {"user": current_user, "empresa": empresa}
