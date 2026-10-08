from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from. import models, schemas
import uuid
import enum
import asyncio
import logging
from decimal import Decimal
from datetime import datetime
from jos_api.modules.atividade.service import registrar_atividade
from jos_api.core.events import emit
from jos_api.core.realtime import manager

logger = logging.getLogger(__name__)

def _broadcast_safe(empresa_id, payload: dict):
    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast(str(empresa_id), payload))
        except RuntimeError:
            asyncio.run(manager.broadcast(str(empresa_id), payload))
    except Exception as e:
        logger.warning(f"[WS] broadcast fail {e} type={payload.get('type')}")

def get_produto_by_id(db: Session, produto_id: uuid.UUID, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    p = db.query(models.Product).filter(models.Product.id == produto_id, models.Product.empresa_id == empresa_id, models.Product.deleted_at == None).first()
    if not p: raise HTTPException(404, "Produto não encontrado")
    return p

def get_produto_by_codigo(db: Session, codigo: str, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    return db.query(models.Product).filter(models.Product.empresa_id == empresa_id, models.Product.deleted_at == None, or_(models.Product.codigo == codigo, models.Product.codigo_barras == codigo, models.Product.codigo_qr == codigo)).first()

def get_produtos(db: Session, empresa_id: uuid.UUID | None, search="", categoria="", tipo="", ativo: bool | None = None, skip=0, limit=10):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    q = db.query(models.Product).filter(models.Product.empresa_id == empresa_id, models.Product.deleted_at == None)
    if ativo is not None: q = q.filter(models.Product.ativo == ativo)
    if search and search.strip():
        s = f"%{search.strip()}%"
        q = q.filter(or_(models.Product.nome.ilike(s), models.Product.codigo.ilike(s)))
    if categoria and categoria.strip(): q = q.filter(models.Product.categoria == categoria.strip())
    if tipo and tipo.strip(): q = q.filter(models.Product.tipo == tipo.strip())
    total = q.count()
    items = q.order_by(models.Product.nome.asc()).offset(skip).limit(limit).all()
    return items, total

def create_produto(db: Session, produto: schemas.ProdutoCreateRequest, empresa_id: uuid.UUID | None, created_by: uuid.UUID | None = None, criado_por_nome: str = "Sistema", ip: str | None = None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    exists = db.query(models.Product).filter(models.Product.empresa_id == empresa_id, models.Product.codigo == produto.codigo, models.Product.deleted_at == None).first()
    if exists:
        raise HTTPException(400, f"Código '{produto.codigo}' já existe.")
    data = produto.model_dump()
    if isinstance(data.get("tipo"), enum.Enum): data["tipo"] = data["tipo"].value
    if isinstance(data.get("unidade"), enum.Enum): data["unidade"] = data["unidade"].value
    if data.get("tem_iva") is False: data["iva"] = Decimal("0")
    else:
        if data.get("iva") is None or data.get("iva") == Decimal("0"): data["iva"] = Decimal("14.0")
    if data.get("tipo") in [models.ProductType.SERVICE.value, models.ProductType.KIT.value, "SERVICE", "KIT"]:
        data["controlar_stock"] = False; data["stock_atual"] = Decimal("0")
    db_prod = models.Product(**data, empresa_id=empresa_id, created_by=created_by)
    try:
        db.add(db_prod); db.flush()
        registrar_atividade(db, empresa_id=empresa_id, modulo="PRODUTO", acao="CRIAR", descricao=f"Criou produto '{db_prod.nome}' ({db_prod.codigo})", entidade="Product", entidade_id=db_prod.id, entidade_nome=db_prod.nome, user_id=created_by, user_nome=criado_por_nome, detalhes=data, ip=ip, commit=False)
        db.commit(); db.refresh(db_prod)

        payload = {"id": str(db_prod.id), "nome": db_prod.nome, "codigo": db_prod.codigo, "preco_venda": str(db_prod.preco_venda), "stock_atual": str(db_prod.stock_atual), "controlar_stock": db_prod.controlar_stock, "ativo": db_prod.ativo, "categoria": db_prod.categoria, "tem_iva": db_prod.tem_iva, "iva": str(db_prod.iva)}
        emit(str(empresa_id), "produto:created", data=payload)
        # WS STOCKBOT
        _broadcast_safe(empresa_id, {"type": "produto:created", "data": payload})
        _broadcast_safe(empresa_id, {"type": "stock.updated", "produto_id": str(db_prod.id), "nome_produto": db_prod.nome, "novo_estoque": str(db_prod.stock_atual), "stock_atual": str(db_prod.stock_atual)})
        _broadcast_safe(empresa_id, {"type": "produto:update", "data": payload})

        return db_prod
    except IntegrityError as e:
        db.rollback()
        if "uq_produto_codigo_empresa" in str(e.orig): raise HTTPException(400, f"Código '{produto.codigo}' já existe.")
        raise HTTPException(400, "Erro ao criar: dados duplicados")

def update_produto(db: Session, produto_id: uuid.UUID, update: schemas.ProdutoUpdateRequest, empresa_id: uuid.UUID | None, user_id: uuid.UUID | None = None, user_nome: str = "Sistema", ip: str | None = None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    prod = get_produto_by_id(db, produto_id, empresa_id)
    antes = prod.nome
    d = update.model_dump(exclude_unset=True)
    if isinstance(d.get("tipo"), enum.Enum): d["tipo"] = d["tipo"].value
    if "tem_iva" in d:
        if d["tem_iva"] is False: d["iva"] = Decimal("0")
        else:
            if "iva" not in d or d["iva"] is None or d["iva"] == Decimal("0"):
                if prod.iva == Decimal("0"): d["iva"] = Decimal("14.0")
    if "tipo" in d and d["tipo"] in [models.ProductType.SERVICE.value, models.ProductType.KIT.value, "SERVICE", "KIT"]:
        d["controlar_stock"] = False; d["stock_atual"] = Decimal("0")
    for k, v in d.items(): setattr(prod, k, v)
    db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="PRODUTO", acao="EDITAR", descricao=f"Editou produto '{antes}' -> '{prod.nome}'", entidade="Product", entidade_id=prod.id, entidade_nome=prod.nome, user_id=user_id, user_nome=user_nome, detalhes={"alterado": d, "antes": antes}, ip=ip, commit=False)
    db.commit(); db.refresh(prod)

    payload = {"id": str(prod.id), "nome": prod.nome, "codigo": prod.codigo, "preco_venda": str(prod.preco_venda), "stock_atual": str(prod.stock_atual), "controlar_stock": prod.controlar_stock, "ativo": prod.ativo, "categoria": prod.categoria, "tem_iva": prod.tem_iva, "iva": str(prod.iva), "imagem_url": prod.imagem_url}
    emit(str(empresa_id), "produto:update", data=payload)
    _broadcast_safe(empresa_id, {"type": "produto:update", "data": payload})
    _broadcast_safe(empresa_id, {"type": "stock.updated", "produto_id": str(prod.id), "nome_produto": prod.nome, "novo_estoque": str(prod.stock_atual), "stock_atual": str(prod.stock_atual)})

    # notificação stock baixo
    if prod.controlar_stock and prod.stock_minimo and prod.stock_atual <= prod.stock_minimo:
        _broadcast_safe(empresa_id, {"type": "notificacao:nova", "data": {"id": f"stock-{prod.id}", "tipo": "STOCK_BAIXO", "titulo": f"Stock baixo: {prod.nome}", "desc": f"Restam {prod.stock_atual}", "time": "agora", "produto_id": str(prod.id)}})

    return prod

def delete_produto(db: Session, produto_id: uuid.UUID, empresa_id: uuid.UUID | None, user_id: uuid.UUID | None = None, user_nome: str = "Sistema", ip: str | None = None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    prod = db.query(models.Product).filter(models.Product.id == produto_id, models.Product.empresa_id == empresa_id).first()
    if not prod: raise HTTPException(404, "Produto não encontrado")
    if prod.deleted_at is not None: return {"message": "Já apagado"}
    nome_guardado = prod.nome; codigo_guardado = prod.codigo
    prod.deleted_at = datetime.utcnow(); prod.ativo = False; db.flush()
    registrar_atividade(db, empresa_id=empresa_id, modulo="PRODUTO", acao="DELETAR", descricao=f"Apagou produto '{nome_guardado}' ({codigo_guardado})", entidade="Product", entidade_id=prod.id, entidade_nome=nome_guardado, user_id=user_id, user_nome=user_nome, detalhes={"codigo": codigo_guardado, "preco": str(prod.preco_venda), "stock": str(prod.stock_atual)}, ip=ip, commit=False)
    db.commit()
    emit(str(empresa_id), "produto:deleted", data={"id": str(prod.id)})
    _broadcast_safe(empresa_id, {"type": "produto:deleted", "data": {"id": str(prod.id)}})
    _broadcast_safe(empresa_id, {"type": "stock.updated", "produto_id": str(prod.id), "deleted": True})
    return {"message": f"Produto '{nome_guardado}' apagado"}

def baixar_stock(db: Session, produto_id: uuid.UUID, qtd: Decimal, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    prod = get_produto_by_id(db, produto_id, empresa_id)
    if not prod.controlar_stock: return prod
    if prod.stock_atual < qtd and not prod.allow_negative: raise ValueError(f"Stock insuficiente: {prod.stock_atual}")
    prod.stock_atual -= qtd; db.commit(); db.refresh(prod)

    payload = {"id": str(prod.id), "stock_atual": str(prod.stock_atual)}
    emit(str(empresa_id), "produto:update", data=payload)
    _broadcast_safe(empresa_id, {"type": "stock.updated", "produto_id": str(prod.id), "nome_produto": prod.nome, "novo_estoque": str(prod.stock_atual), "stock_atual": str(prod.stock_atual)})
    _broadcast_safe(empresa_id, {"type": "produto:update", "data": payload})

    if prod.stock_atual == 0:
        _broadcast_safe(empresa_id, {"type": "notificacao:nova", "data": {"id": f"stock-{prod.id}", "tipo": "STOCK_ZERADO", "titulo": f"{prod.nome} zerado!", "desc": f"Stock chegou a 0", "time": "agora"}})
    elif prod.stock_minimo and prod.stock_atual <= prod.stock_minimo:
        _broadcast_safe(empresa_id, {"type": "notificacao:nova", "data": {"id": f"stock-{prod.id}", "tipo": "STOCK_BAIXO", "titulo": f"Stock baixo: {prod.nome}", "desc": f"Restam {prod.stock_atual}", "time": "agora"}})

    return prod

def get_categorias(db: Session, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    rows = db.query(models.Product.categoria).filter(models.Product.empresa_id == empresa_id, models.Product.categoria.isnot(None), models.Product.deleted_at == None).distinct().limit(100).all()
    return [r[0] for r in rows if r[0]]

def get_produtos_stock_baixo(db: Session, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    return db.query(models.Product).filter(models.Product.empresa_id == empresa_id, models.Product.ativo == True, models.Product.controlar_stock == True, models.Product.stock_atual <= models.Product.stock_minimo, models.Product.deleted_at == None).all()
