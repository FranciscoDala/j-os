from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User
from. import schemas, service
from jos_api.core.uploadImagem import upload_image

router = APIRouter(prefix="/empresas", tags=["empresas"])

async def _try_upload(imagem: UploadFile | None, empresa_id: UUID) -> str | None:
    if not imagem or not imagem.filename:
        return None
    return await upload_image(imagem, str(empresa_id), folder="empresas/logos")

@router.post("", response_model=schemas.EmpresaOut)
def criar_empresa(dados: schemas.EmpresaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.criar_empresa(db, dados, current_user)

@router.get("", response_model=list[schemas.EmpresaOut])
def listar_minhas_empresas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.listar_empresas_user(db, current_user.id)

@router.get("/{empresa_id}", response_model=schemas.EmpresaOut)
def get_empresa(empresa_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.get_empresa(db, empresa_id)

@router.put("/{empresa_id}", response_model=schemas.EmpresaOut)
async def atualizar_empresa(
    empresa_id: UUID,
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    province: Optional[str] = Form(None),
    iban: Optional[str] = Form(None),
    iban2: Optional[str] = Form(None),
    banco1: Optional[str] = Form(None),
    banco2: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    banner: Optional[UploadFile] = File(None),
    nome_fantasia: Optional[str] = Form(None),
    nif: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = {}
    def add(k,v):
        if v is not None and str(v).strip()!= "":
            update_data[k] = str(v).strip()
    add("email", email); add("phone", phone); add("address", address); add("city", city); add("province", province)
    add("iban", iban); add("iban2", iban2); add("banco1", banco1); add("banco2", banco2)
    if nome_fantasia and nome_fantasia.strip(): update_data["nome_fantasia"] = nome_fantasia.strip()
    if nif and nif.strip(): update_data["nif"] = nif.strip()
    if logo and logo.filename:
        url = await _try_upload(logo, empresa_id)
        if url: update_data["logo_url"] = url
    if banner and banner.filename:
        url = await upload_image(banner, str(empresa_id), folder="empresas/banners")
        if url: update_data["image_url"] = url
    schema_data = schemas.UpdateEmpresaRequest(**update_data)
    return service.atualizar_empresa(db, empresa_id, schema_data)

@router.post("/{empresa_id}/logo", response_model=schemas.EmpresaOut)
async def upload_logo(empresa_id: UUID, logo: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    url = await _try_upload(logo, empresa_id)
    if not url: raise HTTPException(400, "Falha no upload")
    return service.atualizar_empresa(db, empresa_id, schemas.UpdateEmpresaRequest(logo_url=url))

@router.delete("/{empresa_id}")
def deletar_empresa(empresa_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.deletar_empresa(db, empresa_id)

@router.post("/{empresa_id}/vincular-usuario")
def vincular_usuario(empresa_id: UUID, dados: schemas.VincularUsuarioRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.vincular_usuario(db, empresa_id, dados, current_user)

@router.patch("/{empresa_id}/agt", response_model=schemas.EmpresaOut)
def atualizar_agt(empresa_id: UUID, dados: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.atualizar_agt_info(db, empresa_id, dados)
