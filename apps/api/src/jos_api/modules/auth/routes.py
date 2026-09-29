from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from. import schemas, service
from.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(dados: schemas.UserCreate, db: Session = Depends(get_db)):
    return service.criar_usuario(db, dados)

@router.post("/login", response_model=schemas.LoginResponse)
def login(dados: schemas.UserLogin, db: Session = Depends(get_db)):
    result = service.autenticar(db, dados)
    return result

@router.post("/select-empresa", response_model=schemas.LoginResponse)
def select_empresa(dados: schemas.SelectEmpresaRequest, db: Session = Depends(get_db)):
    return service.selecionar_empresa(db, dados)

@router.get("/me", response_model=schemas.UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
