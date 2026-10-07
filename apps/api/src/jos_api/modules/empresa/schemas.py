from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import datetime
from.models import TipoEmpresaEnum

class EmpresaCreate(BaseModel):
    nome_fantasia: str
    cnpj: Optional[str] = None
    tipo: TipoEmpresaEnum = TipoEmpresaEnum.VAREJO
    nif: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    iban: Optional[str] = None
    iban2: Optional[str] = None
    banco1: Optional[str] = None
    banco2: Optional[str] = None
    logo_url: Optional[str] = None
    image_url: Optional[str] = None
    tipo_agt: Optional[str] = None
    estado_agt: Optional[str] = None
    inadimplente: Optional[str] = None
    regime_iva: Optional[str] = None
    residente_fiscal: Optional[str] = None

class UpdateEmpresaRequest(BaseModel):
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    tipo: Optional[TipoEmpresaEnum] = None
    nif: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    iban: Optional[str] = None
    iban2: Optional[str] = None
    banco1: Optional[str] = None
    banco2: Optional[str] = None
    logo_url: Optional[str] = None
    image_url: Optional[str] = None
    tipo_agt: Optional[str] = None
    estado_agt: Optional[str] = None
    inadimplente: Optional[str] = None
    regime_iva: Optional[str] = None
    residente_fiscal: Optional[str] = None
    nif_agt_name: Optional[str] = None
    nif_verified: Optional[bool] = None

class EmpresaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    nome_fantasia: str
    cnpj: Optional[str] = None
    tipo: TipoEmpresaEnum
    nif: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    iban: Optional[str] = None
    iban2: Optional[str] = None
    banco1: Optional[str] = None
    banco2: Optional[str] = None
    logo_url: Optional[str] = None
    image_url: Optional[str] = None
    nif_verified: Optional[bool] = None
    nif_agt_name: Optional[str] = None
    tipo_agt: Optional[str] = None
    estado_agt: Optional[str] = None
    inadimplente: Optional[str] = None
    regime_iva: Optional[str] = None
    residente_fiscal: Optional[str] = None
    ultima_verificacao_agt: Optional[datetime] = None
    created_at: Optional[datetime] = None

class VincularUsuarioRequest(BaseModel):
    email: EmailStr
    role: str = "FUNCIONARIO"

VincularUsuarioSchema = VincularUsuarioRequest
