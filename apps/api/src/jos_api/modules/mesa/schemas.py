from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid
from .models import MesaStatus, ReservaStatus

class MesaCreate(BaseModel):
    numero: str
    capacidade: int = 4
    zona: str = "Salão"
    pos_x: int = 0
    pos_y: int = 0

class MesaUpdate(BaseModel):
    numero: Optional[str] = None
    capacidade: Optional[int] = None
    zona: Optional[str] = None
    ativa: Optional[bool] = None
    status: Optional[MesaStatus] = None
    pos_x: Optional[int] = None
    pos_y: Optional[int] = None

class MesaResponse(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    numero: str
    capacidade: int
    zona: Optional[str]
    status: MesaStatus
    venda_atual_id: Optional[uuid.UUID] = None
    garcom_id: Optional[uuid.UUID] = None
    aberta_em: Optional[datetime] = None
    ativa: bool
    created_at: datetime
    updated_at: datetime
    reserva_ativa: Optional["ReservaResponse"] = None
    tempo_ocupada_min: Optional[int] = None
    class Config: from_attributes = True

class ReservaCreate(BaseModel):
    mesa_id: uuid.UUID
    cliente_nome: str
    cliente_telefone: Optional[str] = None
    pessoas: int = 2
    data_reserva: datetime

class ReservaResponse(BaseModel):
    id: uuid.UUID
    mesa_id: uuid.UUID
    empresa_id: uuid.UUID
    cliente_nome: str
    cliente_telefone: Optional[str]
    pessoas: int
    data_reserva: datetime
    status: ReservaStatus
    venda_id: Optional[uuid.UUID] = None
    created_at: datetime
    class Config: from_attributes = True

class OcuparMesaRequest(BaseModel):
    garcom_id: Optional[uuid.UUID] = None
    pessoas: Optional[int] = None

MesaResponse.model_rebuild()
