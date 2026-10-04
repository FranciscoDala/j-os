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
        {"nome": "GERENTE", "slug": "gerente", "role": RoleEnum.GERENTE_RESTAURANTE, "permissoes": {"modulos": ["restaurante", "caixa", "financeiro", "rh", "seguranca"], "acoes": ["restaurante:*", "financeiro:*", "rh:*", "seguranca:read"]}},
        {"nome": "OPERADOR_CAIXA", "slug": "caixa", "role": RoleEnum.OPERADOR_CAIXA, "permissoes": {"modulos": ["restaurante", "caixa", "financeiro"], "acoes": ["restaurante:caixa:*", "restaurante:venda:*", "restaurante:pedido:read", "restaurante:produto:read", "restaurante:cliente:read", "restaurante:cliente:create", "restaurante:entidade:read", "financeiro:read_own"]}},
        {"nome": "GARÇOM", "slug": "garcom", "role": RoleEnum.GARCOM, "permissoes": {"modulos": ["restaurante"], "acoes": ["restaurante:pedido:create", "restaurante:pedido:read", "restaurante:produto:read", "restaurante:mesa:read", "restaurante:cliente:read", "restaurante:entidade:read"]}},
        {"nome": "COZINHA", "slug": "cozinha", "role": RoleEnum.FUNCIONARIO, "permissoes": {"modulos": ["restaurante"], "acoes": ["restaurante:pedido:read", "restaurante:produto:read"]}},
        {"nome": "FINANCEIRO", "slug": "financeiro", "role": RoleEnum.RH, "permissoes": {"modulos": ["financeiro", "rh"], "acoes": ["financeiro:*", "rh:read", "restaurante:entidade:read"]}},
        {"nome": "RH", "slug": "rh", "role": RoleEnum.RH, "permissoes": {"modulos": ["rh", "restaurante"], "acoes": ["rh:*", "restaurante:entidade:*", "financeiro:read_own"]}},
    ],
    TipoEmpresaEnum.VAREJO: [
        {"nome": "DONO", "slug": "dono", "role": RoleEnum.DONO, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}},
        {"nome": "GERENTE", "slug": "gerente", "role": RoleEnum.GERENTE_RESTAURANTE, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}},
        {"nome": "OPERADOR_CAIXA", "slug": "caixa", "role": RoleEnum.OPERADOR_CAIXA, "permissoes": {"modulos": ["caixa", "vendas"], "acoes": ["restaurante:caixa:*", "restaurante:venda:*", "restaurante:entidade:read"]}},
        {"nome": "VENDEDOR", "slug": "vendedor", "role": RoleEnum.FUNCIONARIO, "permissoes": {"modulos": ["vendas"], "acoes": ["restaurante:venda:create", "restaurante:venda:read"]}},
        {"nome": "ESTOQUE", "slug": "estoque", "role": RoleEnum.FUNCIONARIO, "permissoes": {"modulos": ["estoque"], "acoes": ["restaurante:produto:*"]}},
        {"nome": "RH", "slug": "rh", "role": RoleEnum.RH, "permissoes": {"modulos": ["funcionarios"], "acoes": ["rh:*", "restaurante:entidade:*"]}},
        {"nome": "FINANCEIRO", "slug": "financeiro", "role": RoleEnum.RH, "permissoes": {"modulos": ["caixa", "financeiro"], "acoes": ["financeiro:*"]}},
    ],
    TipoEmpresaEnum.SEGURANCA: [
        {"nome": "DONO", "slug": "dono", "role": RoleEnum.DONO, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}},
        {"nome": "GERENTE_OPERACIONAL", "slug": "gerente_operacional", "role": RoleEnum.GERENTE_RESTAURANTE, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}},
        {"nome": "SUPERVISOR", "slug": "supervisor", "role": RoleEnum.GERENTE_RESTAURANTE, "permissoes": {"modulos": ["escalas", "ocorrencias"], "acoes": ["seguranca:*"]}},
        {"nome": "AGENTE_SEGURANCA", "slug": "agente", "role": RoleEnum.VIGILANTE, "permissoes": {"modulos": ["ocorrencias"], "acoes": ["seguranca:ronda:create", "seguranca:ronda:read_own", "seguranca:ocorrencia:create", "seguranca:ocorrencia:read"]}},
        {"nome": "RH", "slug": "rh", "role": RoleEnum.RH, "permissoes": {"modulos": ["funcionarios"], "acoes": ["rh:*"]}},
    ],
    TipoEmpresaEnum.SERVICOS: [
        {"nome": "DONO", "slug": "dono", "role": RoleEnum.DONO, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}},
        {"nome": "GERENTE", "slug": "gerente", "role": RoleEnum.GERENTE_RESTAURANTE, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}},
        {"nome": "OPERADOR_CAIXA", "slug": "caixa", "role": RoleEnum.OPERADOR_CAIXA, "permissoes": {"modulos": ["caixa"], "acoes": ["restaurante:caixa:*", "restaurante:venda:*", "restaurante:entidade:read"]}},
    ]
}

def seed_perfis_por_tipo(db: Session, empresa_id: UUID, tipo: TipoEmpresaEnum):
    templates = TEMPLATE_PERFIS.get(tipo, TEMPLATE_PERFIS[TipoEmpresaEnum.VAREJO])
    criados = []
    for t in templates:
        # evita duplicar se já existe
        existe = db.query(Perfil).filter(Perfil.empresa_id==empresa_id, Perfil.slug==t["slug"]).first()
        if existe:
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
    if criados:
        emit(str(empresa_id), "perfis:created", data=[{"id": str(c.id), "nome": c.nome, "slug": c.slug, "role": c.role_equivalente.value} for c in criados])
