from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User
from.schemas import MesaCreate, MesaUpdate, MesaResponse, ReservaCreate, ReservaResponse, OcuparMesaRequest
from. import service

router = APIRouter(prefix="/mesas", tags=["Mesas"])

# FIXAS PRIMEIRO pra não conflitar com /{empresa_id}
@router.get("/{empresa_id}/zonas", response_model=list[str])
def list_zonas(empresa_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.zonas_lista(db, empresa_id)

@router.post("/{empresa_id}/reservar", response_model=ReservaResponse)
def reservar_mesa(empresa_id: uuid.UUID, payload: ReservaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return service.reservar(db, empresa_id, payload)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.get("/{empresa_id}", response_model=list[MesaResponse])
def list_all(
    empresa_id: uuid.UUID,
    status: str = Query(""),
    zona: str = Query(""),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.list_mesas(db, empresa_id, status, zona, search)

@router.post("/{empresa_id}", response_model=MesaResponse, status_code=201)
def criar(empresa_id: uuid.UUID, payload: MesaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return service.create_mesa(db, empresa_id, payload.model_dump())
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.put("/{empresa_id}/{mesa_id}", response_model=MesaResponse)
def atualizar(empresa_id: uuid.UUID, mesa_id: uuid.UUID, payload: MesaUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return service.update_mesa(db, empresa_id, mesa_id, payload.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(404, str(e))

@router.delete("/{empresa_id}/{mesa_id}")
def apagar(empresa_id: uuid.UUID, mesa_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        service.delete_mesa(db, empresa_id, mesa_id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(404, str(e))

@router.post("/{empresa_id}/{mesa_id}/ocupar", response_model=MesaResponse)
def ocupar_mesa(
    empresa_id: uuid.UUID,
    mesa_id: uuid.UUID,
    body: OcuparMesaRequest,
    venda_id: uuid.UUID | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return service.ocupar(db, empresa_id, mesa_id, venda_id, body.garcom_id, body.pessoas)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.post("/{empresa_id}/{mesa_id}/liberar", response_model=MesaResponse)
def liberar_mesa(
    empresa_id: uuid.UUID,
    mesa_id: uuid.UUID,
    limpar: bool = Query(False, description="Se true vai para SUJA, senão LIVRE"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return service.liberar(db, empresa_id, mesa_id, limpar)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.post("/{empresa_id}/{mesa_id}/limpar", response_model=MesaResponse)
def limpar_mesa(empresa_id: uuid.UUID, mesa_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Atalho pra tirar de SUJA -> LIVRE"""
    try:
        return service.liberar(db, empresa_id, mesa_id, limpar=False)
    except ValueError as e:
        raise HTTPException(400, str(e))
