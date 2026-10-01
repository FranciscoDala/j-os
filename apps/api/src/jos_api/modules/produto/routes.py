from fastapi import APIRouter, Depends, Query, HTTPException, Form, File, UploadFile, Request
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional
from decimal import Decimal
import logging
import shutil
from pathlib import Path
from jos_api.db.session import get_db
from jos_api.modules.produto.schemas import ProdutoCreateRequest, ProdutoResponse, ProdutoUpdateRequest, BaixaStockRequest
from jos_api.modules.produto.models import ProductType, ProductUnit
from jos_api.modules.produto import service as produto_service
from jos_api.core.deps import get_current_user, precisa_modulo
from jos_api.modules.auth.models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/produtos", tags=["Produtos"])
MEDIA_ROOT = Path("media/produtos")

def _parse_tipo(tipo_str: str) -> ProductType:
    try: return ProductType(tipo_str)
    except: return ProductType.GENERAL

def _parse_unidade(unidade_str: str) -> ProductUnit:
    try: return ProductUnit(unidade_str)
    except:
        if unidade_str and unidade_str.upper() in ["UN", "UNIT"]: return ProductUnit.UNIT
        return ProductUnit.UNIT

def _parse_bool(v) -> bool:
    if isinstance(v, bool): return v
    if v is None: return False
    if isinstance(v, str):
        return v.lower() in ("true","1","t","yes","on","sim")
    return bool(v)

def _save_upload_file(imagem: UploadFile, empresa_id: uuid.UUID) -> str:
    folder = MEDIA_ROOT / str(empresa_id); folder.mkdir(parents=True, exist_ok=True)
    ext = Path(imagem.filename or "jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"; file_path = folder / filename
    with open(file_path, "wb") as buffer: shutil.copyfileobj(imagem.file, buffer)
    try: imagem.file.close()
    except: pass
    return f"/media/produtos/{empresa_id}/{filename}"

async def _try_upload(imagem: UploadFile | None, empresa_id: uuid.UUID | None) -> str | None:
    if not imagem or not empresa_id or not imagem.filename: return None
    size = getattr(imagem, "size", None)
    if size and size > 5 * 1024 * 1024: raise HTTPException(400, "Imagem muito grande, max 5MB")
    return _save_upload_file(imagem, empresa_id)

def _get_empresa_id_from_perfil(perfil_data) -> uuid.UUID:
    eid = perfil_data.get("empresa_id")
    if not eid: raise HTTPException(403, "Usuário sem empresa vinculada")
    return uuid.UUID(eid) if isinstance(eid, str) else eid

def _get_ip(request: Request): return request.client.host if request.client else None
def _get_nome(user: User, perfil_data): return getattr(user, 'nome', None) or perfil_data.get("perfil_nome", "Sistema")

@router.get("/categorias/lista", response_model=List[str])
def listar_categorias(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    return produto_service.get_categorias(db, empresa_id)

@router.get("/alerta/stock-baixo", response_model=List[ProdutoResponse])
def produtos_stock_baixo(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    return produto_service.get_produtos_stock_baixo(db, empresa_id)

@router.get("/")
def listar_produtos(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), search: str = Query(""), categoria: Optional[str] = Query(None), tipo: Optional[str] = Query(None), ativo: Optional[bool] = Query(None), db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    items, total = produto_service.get_produtos(db, empresa_id, search, categoria or "", tipo or "", ativo, skip, limit)
    return {"items": items, "total": total}

@router.get("/codigo/{codigo}", response_model=ProdutoResponse)
def buscar_por_codigo(codigo: str, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    produto = produto_service.get_produto_by_codigo(db, codigo, empresa_id)
    if not produto: raise HTTPException(404, "Produto não encontrado")
    return produto

@router.get("/{produto_id}", response_model=ProdutoResponse)
def buscar_por_id(produto_id: uuid.UUID, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    return produto_service.get_produto_by_id(db, produto_id, empresa_id)

@router.post("/", response_model=ProdutoResponse, status_code=201)
async def criar_produto(
    request: Request,
    nome: str = Form(...),
    codigo: str = Form(...),
    preco_venda: float = Form(...),
    tipo: str = Form("GENERAL"),
    unidade: str = Form("UNIT"),
    ativo: str = Form("true"),
    controlar_stock: str = Form("true"),
    stock_atual: float = Form(0.0),
    stock_minimo: float = Form(0.0),
    preco_custo: float = Form(0.0),
    codigo_barras: Optional[str] = Form(None),
    codigo_qr: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    categoria: Optional[str] = Form(None),
    iva: float = Form(0.0),
    tem_iva: str = Form("false"),
    peso: Optional[float] = Form(None),
    prep_time: Optional[int] = Form(None),
    kitchen_station: Optional[str] = Form(None),
    is_modifiable: str = Form("false"),
    service_duration: Optional[int] = Form(None),
    imagem: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    perfil_data = Depends(precisa_modulo("caixa")),
    current_user: User = Depends(get_current_user)
):
    try:
        empresa_id = _get_empresa_id_from_perfil(perfil_data)
        imagem_url = await _try_upload(imagem, empresa_id)
        produto_data = ProdutoCreateRequest(
            nome=nome.strip(),
            codigo=codigo.strip(),
            preco_venda=Decimal(str(preco_venda)),
            tipo=_parse_tipo(tipo),
            unidade=_parse_unidade(unidade),
            ativo=_parse_bool(ativo),
            controlar_stock=_parse_bool(controlar_stock),
            stock_atual=Decimal(str(stock_atual)),
            stock_minimo=Decimal(str(stock_minimo)),
            preco_custo=Decimal(str(preco_custo)),
            codigo_barras=codigo_barras,
            codigo_qr=codigo_qr,
            descricao=descricao,
            categoria=categoria,
            iva=Decimal(str(iva)),
            tem_iva=_parse_bool(tem_iva),
            peso=peso,
            imagem_url=imagem_url,
            prep_time=prep_time,
            kitchen_station=kitchen_station,
            is_modifiable=_parse_bool(is_modifiable),
            service_duration=service_duration,
        )
        return produto_service.create_produto(db, produto_data, empresa_id, current_user.id, criado_por_nome=_get_nome(current_user, perfil_data), ip=_get_ip(request))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro criar produto")
        raise HTTPException(500, f"Erro ao criar produto: {str(e)}")


@router.put("/{produto_id}", response_model=ProdutoResponse)
async def atualizar_produto(
    request: Request,
    produto_id: uuid.UUID,
    nome: Optional[str] = Form(None),
    codigo: Optional[str] = Form(None),
    preco_venda: Optional[float] = Form(None),
    tipo: Optional[str] = Form(None),
    ativo: Optional[str] = Form(None),
    controlar_stock: Optional[str] = Form(None),
    stock_atual: Optional[float] = Form(None),
    codigo_barras: Optional[str] = Form(None),
    codigo_qr: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    categoria: Optional[str] = Form(None),
    iva: Optional[float] = Form(None),
    tem_iva: Optional[str] = Form(None),
    imagem: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    perfil_data = Depends(precisa_modulo("caixa")),
    current_user: User = Depends(get_current_user)
):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    update_data = {}
    if nome is not None: update_data["nome"] = nome
    if codigo is not None: update_data["codigo"] = codigo
    if preco_venda is not None: update_data["preco_venda"] = Decimal(str(preco_venda))
    if tipo is not None: update_data["tipo"] = _parse_tipo(tipo)
    if ativo is not None: update_data["ativo"] = _parse_bool(ativo)
    if controlar_stock is not None: update_data["controlar_stock"] = _parse_bool(controlar_stock)
    if stock_atual is not None: update_data["stock_atual"] = Decimal(str(stock_atual))
    if codigo_barras is not None: update_data["codigo_barras"] = codigo_barras
    if codigo_qr is not None: update_data["codigo_qr"] = codigo_qr
    if descricao is not None: update_data["descricao"] = descricao
    if categoria is not None: update_data["categoria"] = categoria
    if iva is not None: update_data["iva"] = Decimal(str(iva))
    if tem_iva is not None: update_data["tem_iva"] = _parse_bool(tem_iva)
    if imagem:
        url = await _try_upload(imagem, empresa_id)
        if url: update_data["imagem_url"] = url
    return produto_service.update_produto(db, produto_id, ProdutoUpdateRequest(**update_data), empresa_id, user_id=current_user.id, user_nome=_get_nome(current_user, perfil_data), ip=_get_ip(request))



@router.delete("/{produto_id}")
def delete_produto(request: Request, produto_id: uuid.UUID, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    return produto_service.delete_produto(db, produto_id, empresa_id, user_id=current_user.id, user_nome=_get_nome(current_user, perfil_data), ip=_get_ip(request))

@router.post("/{produto_id}/baixa-stock")
def dar_baixa_stock(produto_id: uuid.UUID, dados: BaixaStockRequest, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    try:
        produto_service.baixar_stock(db, produto_id, dados.quantidade, empresa_id)
        return {"detail": "Stock atualizado"}
    except ValueError as e:
        raise HTTPException(400, str(e))
