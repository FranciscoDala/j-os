from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from. import models
from. import schemas
import uuid
from decimal import Decimal
from datetime import datetime

def get_produto_by_id(db: Session, produto_id: uuid.UUID, empresa_id: uuid.UUID | None):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    p = db.query(models.Product).filter(
        models.Product.id == produto_id,
        models.Product.empresa_id == empresa_id,
        models.Product.deleted_at == None
    ).first()
    if not p:
        raise HTTPException(404, "Produto não encontrado")
    return p

def get_produto_by_codigo(db: Session, codigo: str, empresa_id: uuid.UUID | None):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    return db.query(models.Product).filter(
        models.Product.empresa_id == empresa_id,
        models.Product.deleted_at == None,
        or_(
            models.Product.codigo == codigo,
            models.Product.codigo_barras == codigo,
            models.Product.codigo_qr == codigo
        )
    ).first()

def get_produtos(db: Session, empresa_id: uuid.UUID | None, search="", categoria="", tipo="", ativo: bool | None = None, skip=0, limit=10):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    q = db.query(models.Product).filter(
        models.Product.empresa_id == empresa_id,
        models.Product.deleted_at == None
    )
    if ativo is not None:
        q = q.filter(models.Product.ativo == ativo)
    if search:
        q = q.filter(or_(
            models.Product.nome.ilike(f"%{search}%"),
            models.Product.codigo.ilike(f"%{search}%")
        ))
    if categoria:
        q = q.filter(models.Product.categoria == categoria)
    if tipo:
        q = q.filter(models.Product.tipo == tipo)
    items = q.order_by(models.Product.nome.asc()).offset(skip).limit(limit).all()
    return items, len(items)

def create_produto(db: Session, produto: schemas.ProdutoCreateRequest, empresa_id: uuid.UUID | None, created_by: uuid.UUID | None = None):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    if db.query(models.Product).filter(
        models.Product.empresa_id == empresa_id,
        models.Product.codigo == produto.codigo,
        models.Product.deleted_at == None
    ).first():
        raise HTTPException(400, "Já existe produto com este código")

    data = produto.model_dump()

    # === REGRA IVA OPCIONAL - EMPRESA DECIDE ===
    if data.get("tem_iva") is False:
        data["iva"] = Decimal("0")
    else: # tem_iva True
        # se tem iva mas não informou aliquota, assume 14%
        if data.get("iva") is None or data.get("iva") == Decimal("0"):
            # se veio 0 mas tem_iva True, considera que esqueceu e põe 14
            # se quiser 0 mesmo com tem_iva True, tem que ser explicito depois no update
            # para ser 100% opcional, deixa 0 mesmo: comente a linha abaixo se quiser
            data["iva"] = Decimal("14.0")

    # stock só força pra serviço/kit
    if data.get("tipo") in [models.ProductType.SERVICE, models.ProductType.KIT]:
        data["controlar_stock"] = False
        data["stock_atual"] = Decimal("0")

    db_prod = models.Product(**data, empresa_id=empresa_id, created_by=created_by)
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod

def update_produto(db: Session, produto_id: uuid.UUID, update: schemas.ProdutoUpdateRequest, empresa_id: uuid.UUID | None):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    prod = get_produto_by_id(db, produto_id, empresa_id)
    d = update.model_dump(exclude_unset=True)

    # === REGRA IVA OPCIONAL NO UPDATE ===
    if "tem_iva" in d:
        if d["tem_iva"] is False:
            d["iva"] = Decimal("0")
        else: # True
            if "iva" not in d or d["iva"] is None or d["iva"] == Decimal("0"):
                # se ativou iva e não mandou aliquota, mantém o que tinha ou 14
                if prod.iva == Decimal("0"):
                    d["iva"] = Decimal("14.0")

    if "tipo" in d and d["tipo"] in [models.ProductType.SERVICE, models.ProductType.KIT]:
        d["controlar_stock"] = False
        d["stock_atual"] = Decimal("0")

    for k, v in d.items():
        setattr(prod, k, v)
    db.commit()
    db.refresh(prod)
    return prod

def delete_produto(db: Session, produto_id: uuid.UUID, empresa_id: uuid.UUID | None):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    prod = db.query(models.Product).filter(
        models.Product.id == produto_id,
        models.Product.empresa_id == empresa_id
    ).first()
    if not prod:
        raise HTTPException(404, "Produto não encontrado")
    if prod.deleted_at is not None:
        return {"message": "Já apagado"}
    prod.deleted_at = datetime.utcnow()
    prod.ativo = False
    db.commit()
    return {"message": "Apagado"}

def baixar_stock(db: Session, produto_id: uuid.UUID, qtd: Decimal, empresa_id: uuid.UUID | None):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    prod = get_produto_by_id(db, produto_id, empresa_id)
    if not prod.controlar_stock:
        return prod
    if prod.stock_atual < qtd and not prod.allow_negative:
        raise ValueError(f"Stock insuficiente: {prod.stock_atual}")
    prod.stock_atual -= qtd
    db.commit()
    return prod

def get_categorias(db: Session, empresa_id: uuid.UUID | None):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    rows = db.query(models.Product.categoria).filter(
        models.Product.empresa_id == empresa_id,
        models.Product.categoria.isnot(None),
        models.Product.deleted_at == None
    ).distinct().limit(100).all()
    return [r[0] for r in rows if r[0]]

def get_produtos_stock_baixo(db: Session, empresa_id: uuid.UUID | None):
    if not empresa_id:
        raise HTTPException(403, "Sem empresa")
    return db.query(models.Product).filter(
        models.Product.empresa_id == empresa_id,
        models.Product.ativo == True,
        models.Product.controlar_stock == True,
        models.Product.stock_atual <= models.Product.stock_minimo,
        models.Product.deleted_at == None
    ).all()
