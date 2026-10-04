from uuid import UUID
from sqlalchemy.orm import Session
from.models import TipoEmpresaEnum
from.perfis_models import Perfil
from jos_api.modules.auth.models import RoleEnum
from jos_api.core.events import emit

# TEMPLATE CORRETO - cada perfil já sabe qual RoleEnum ele é e quais acoes tem
TEMPLATE_PERFIS = {
    TipoEmpresaEnum.RESTAURANTE: [
        {"nome": "DONO", "slug": "dono", "role": RoleEnum.DONO, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}},
        {"nome": "GERENTE", "slug": "gerente_restaurante", "role": RoleEnum.GERENTE_RESTAURANTE, "permissoes": {"modulos": ["restaurante", "caixa", "financeiro", "rh"], "acoes": ["restaurante:*", "financeiro:*", "rh:*"]}},
        {"nome": "OPERADOR_CAIXA", "slug": "operador_caixa", "role": RoleEnum.OPERADOR_CAIXA, "permissoes": {"modulos": ["restaurante", "caixa"], "acoes": ["restaurante:caixa:*", "restaurante:venda:*", "restaurante:produto:read", "restaurante:entidade:read"]}},
        {"nome": "CAIXA", "slug": "caixa", "role": RoleEnum.CAIXA, "permissoes": {"modulos": ["caixa"], "acoes": ["restaurante:caixa:*", "restaurante:venda:create", "restaurante:entidade:read"]}},
        {"nome": "GARÇOM", "slug": "garcom", "role": RoleEnum.GARCOM, "permissoes": {"modulos": ["restaurante"], "acoes": ["restaurante:pedido:*", "restaurante:produto:read", "restaurante:entidade:read"]}},
        {"nome": "COZINHA", "slug": "cozinha", "role": RoleEnum.FUNCIONARIO, "permissoes": {"modulos": ["restaurante"], "acoes": ["restaurante:pedido:read"]}},
        {"nome": "RH", "slug": "rh", "role": RoleEnum.RH, "permissoes": {"modulos": ["rh"], "acoes": ["rh:*", "restaurante:entidade:*"]}},
    ],
}
def seed_perfis_por_tipo(db: Session, empresa_id: UUID, tipo: TipoEmpresaEnum):
    templates = TEMPLATE_PERFIS.get(tipo, TEMPLATE_PERFIS[TipoEmpresaEnum.RESTAURANTE])
    criados = []
    for t in templates:
        existe = db.query(Perfil).filter(Perfil.empresa_id==empresa_id, Perfil.slug==t["slug"]).first()
        if existe:
            # ATUALIZA - isso corrige o bug do dono minúsculo
            existe.role_equivalente = t["role"]
            existe.permissoes = t["permissoes"]
            continue
        p = Perfil(
            empresa_id=empresa_id,
            nome=t["nome"],
            slug=t["slug"],
            role_equivalente=t["role"],
            permissoes=t["permissoes"],
            is_system=True
        )
        db.add(p)
        criados.append(p)
    db.flush()
    db.commit()
    return db.query(Perfil).filter(Perfil.empresa_id==empresa_id).all()
