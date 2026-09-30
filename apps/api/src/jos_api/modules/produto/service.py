from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from. import models
from. import schemas
import uuid
from decimal import Decimal
from datetime import datetime
from jos_api.modules.atividade.service import registrar_atividade

def get_produto_by_id(db: Session, produto_id: uuid.UUID, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    p = db.query(models.Product).filter(
        models.Product.id == produto_id,
        models.Product.empresa_id == empresa_id,
        models.Product.deleted_at == None
    ).first()
    if not p: raise HTTPException(404, "Produto não encontrado")
    return p

def get_produto_by_codigo(db: Session, codigo: str, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    return db.query(models.Product).filter(
        models.Product.empresa_id == empresa_id,
        models.Product.deleted_at == None,
        or_(models.Product.codigo == codigo, models.Product.codigo_barras == codigo, models.Product.codigo_qr == codigo)
    ).first()

def get_produtos(db: Session, empresa_id: uuid.UUID | None, search="", categoria="", tipo="", ativo: bool | None = None, skip=0, limit=10):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    q = db.query(models.Product).filter(models.Product.empresa_id == empresa_id, models.Product.deleted_at == None)
    if ativo is not None: q = q.filter(models.Product.ativo == ativo)
    if search: q = q.filter(or_(models.Product.nome.ilike(f"%{search}%"), models.Product.codigo.ilike(f"%{search}%")))
    if categoria: q = q.filter(models.Product.categoria == categoria)
    if tipo: q = q.filter(models.Product.tipo == tipo)
    items = q.order_by(models.Product.nome.asc()).offset(skip).limit(limit).all()
    return items, len(items)

def create_produto(db: Session, produto: schemas.ProdutoCreateRequest, empresa_id: uuid.UUID | None, created_by: uuid.UUID | None = None, criado_por_nome: str = "Sistema", ip: str | None = None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    if db.query(models.Product).filter(models.Product.empresa_id == empresa_id, models.Product.codigo == produto.codigo, models.Product.deleted_at == None).first():
        raise HTTPException(400, "Já existe produto com este código")
    data = produto.model_dump()
    if data.get("tem_iva") is False: data["iva"] = Decimal("0")
    else:
        if data.get("iva") is None or data.get("iva") == Decimal("0"):
            data["iva"] = Decimal("14.0")
    if data.get("tipo") in [models.ProductType.SERVICE, models.ProductType.KIT]:
        data["controlar_stock"] = False; data["stock_atual"] = Decimal("0")
    db_prod = models.Product(**data, empresa_id=empresa_id, created_by=created_by)
    db.add(db_prod); db.flush()

    registrar_atividade(db, empresa_id=empresa_id, modulo="PRODUTO", acao="CRIAR",
        descricao=f"Criou produto '{db_prod.nome}' ({db_prod.codigo}) R$ {db_prod.preco_venda}",
        entidade="Product", entidade_id=db_prod.id, entidade_nome=db_prod.nome,
        user_id=created_by, user_nome=criado_por_nome, detalhes=data, ip=ip, commit=False)

    db.commit(); db.refresh(db_prod)
    return db_prod

def update_produto(db: Session, produto_id: uuid.UUID, update: schemas.ProdutoUpdateRequest, empresa_id: uuid.UUID | None, user_id: uuid.UUID | None = None, user_nome: str = "Sistema", ip: str | None = None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    prod = get_produto_by_id(db, produto_id, empresa_id)
    antes = prod.nome
    d = update.model_dump(exclude_unset=True)
    if "tem_iva" in d:
        if d["tem_iva"] is False: d["iva"] = Decimal("0")
        else:
            if "iva" not in d or d["iva"] is None or d["iva"] == Decimal("0"):
                if prod.iva == Decimal("0"): d["iva"] = Decimal("14.0")
    if "tipo" in d and d["tipo"] in [models.ProductType.SERVICE, models.ProductType.KIT]:
        d["controlar_stock"] = False; d["stock_atual"] = Decimal("0")
    for k, v in d.items(): setattr(prod, k, v)
    db.flush()

    registrar_atividade(db, empresa_id=empresa_id, modulo="PRODUTO", acao="EDITAR",
        descricao=f"Editou produto '{antes}' -> '{prod.nome}'",
        entidade="Product", entidade_id=prod.id, entidade_nome=prod.nome,
        user_id=user_id, user_nome=user_nome, detalhes={"alterado": d, "antes": antes}, ip=ip, commit=False)

    db.commit(); db.refresh(prod)
    return prod

def delete_produto(db: Session, produto_id: uuid.UUID, empresa_id: uuid.UUID | None, user_id: uuid.UUID | None = None, user_nome: str = "Sistema", ip: str | None = None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    prod = db.query(models.Product).filter(models.Product.id == produto_id, models.Product.empresa_id == empresa_id).first()
    if not prod: raise HTTPException(404, "Produto não encontrado")
    if prod.deleted_at is not None: return {"message": "Já apagado"}

    nome_guardado = prod.nome
    codigo_guardado = prod.codigo

    prod.deleted_at = datetime.utcnow(); prod.ativo = False
    db.flush()

    registrar_atividade(db, empresa_id=empresa_id, modulo="PRODUTO", acao="DELETAR",
        descricao=f"Apagou produto '{nome_guardado}' ({codigo_guardado})",
        entidade="Product", entidade_id=prod.id, entidade_nome=nome_guardado,
        user_id=user_id, user_nome=user_nome,
        detalhes={"codigo": codigo_guardado, "preco": str(prod.preco_venda), "stock": str(prod.stock_atual)},
        ip=ip, commit=False)

    db.commit()
    return {"message": f"Produto '{nome_guardado}' apagado"}

def baixar_stock(db: Session, produto_id: uuid.UUID, qtd: Decimal, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    prod = get_produto_by_id(db, produto_id, empresa_id)
    if not prod.controlar_stock: return prod
    if prod.stock_atual < qtd and not prod.allow_negative:
        raise ValueError(f"Stock insuficiente: {prod.stock_atual}")
    prod.stock_atual -= qtd
    db.commit(); return prod

def get_categorias(db: Session, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    rows = db.query(models.Product.categoria).filter(models.Product.empresa_id == empresa_id, models.Product.categoria.isnot(None), models.Product.deleted_at == None).distinct().limit(100).all()
    return [r[0] for r in rows if r[0]]

def get_produtos_stock_baixo(db: Session, empresa_id: uuid.UUID | None):
    if not empresa_id: raise HTTPException(403, "Sem empresa")
    return db.query(models.Product).filter(models.Product.empresa_id == empresa_id, models.Product.ativo == True, models.Product.controlar_stock == True, models.Product.stock_atual <= models.Product.stock_minimo, models.Product.deleted_at == None).all()
