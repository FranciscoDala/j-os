from uuid import UUID
from sqlalchemy.orm import Session
from .models import TipoEmpresaEnum
from .perfis_models import Perfil
from jos_api.core.events import emit

TEMPLATE_PERFIS = {
    TipoEmpresaEnum.RESTAURANTE: [
        {"nome": "DONO", "slug": "dono", "permissoes": {"all": True}},
        {"nome": "GERENTE", "slug": "gerente", "permissoes": {"modulos": ["caixa", "mesas", "relatorios", "funcionarios"]}},
        {"nome": "OPERADOR_CAIXA", "slug": "caixa", "permissoes": {"modulos": ["caixa", "mesas"]}},
        {"nome": "GARÇOM", "slug": "garcom", "permissoes": {"modulos": ["mesas", "pedidos"]}},
        {"nome": "COZINHA", "slug": "cozinha", "permissoes": {"modulos": ["pedidos"]}},
        {"nome": "FINANCEIRO", "slug": "financeiro", "permissoes": {"modulos": ["caixa", "relatorios"]}},
        {"nome": "RH", "slug": "rh", "permissoes": {"modulos": ["funcionarios", "escalas", "folha"]}},
    ],
    TipoEmpresaEnum.SEGURANCA: [
        {"nome": "DONO", "slug": "dono", "permissoes": {"all": True}},
        {"nome": "GERENTE_OPERACIONAL", "slug": "gerente_operacional", "permissoes": {"all": True}},
        {"nome": "SUPERVISOR", "slug": "supervisor", "permissoes": {"modulos": ["escalas", "ocorrencias"]}},
        {"nome": "AGENTE_SEGURANCA", "slug": "agente", "permissoes": {"modulos": ["ocorrencias"]}},
        {"nome": "FINANCEIRO", "slug": "financeiro", "permissoes": {"modulos": ["financeiro", "relatorios"]}},
        {"nome": "RH", "slug": "rh", "permissoes": {"modulos": ["funcionarios", "escalas", "folha", "recrutamento"]}},
    ],
    TipoEmpresaEnum.SERVICOS: [
        {"nome": "DONO", "slug": "dono", "permissoes": {"all": True}},
        {"nome": "GERENTE", "slug": "gerente", "permissoes": {"all": True}},
        {"nome": "ATENDIMENTO", "slug": "atendimento", "permissoes": {"modulos": ["clientes", "agendamentos"]}},
        {"nome": "TECNICO", "slug": "tecnico", "permissoes": {"modulos": ["servicos"]}},
        {"nome": "OPERADOR_CAIXA", "slug": "caixa", "permissoes": {"modulos": ["caixa"]}},
        {"nome": "FINANCEIRO", "slug": "financeiro", "permissoes": {"modulos": ["financeiro"]}},
        {"nome": "RH", "slug": "rh", "permissoes": {"modulos": ["funcionarios", "escalas", "folha"]}},
    ],
    TipoEmpresaEnum.VAREJO: [
        {"nome": "DONO", "slug": "dono", "permissoes": {"all": True}},
        {"nome": "GERENTE", "slug": "gerente", "permissoes": {"all": True}},
        {"nome": "OPERADOR_CAIXA", "slug": "caixa", "permissoes": {"modulos": ["caixa", "vendas"]}},
        {"nome": "VENDEDOR", "slug": "vendedor", "permissoes": {"modulos": ["vendas"]}},
        {"nome": "ESTOQUE", "slug": "estoque", "permissoes": {"modulos": ["estoque"]}},
        {"nome": "RH", "slug": "rh", "permissoes": {"modulos": ["funcionarios", "escalas", "folha"]}},
        {"nome": "FINANCEIRO", "slug": "financeiro", "permissoes": {"modulos": ["caixa", "relatorios"]}},
    ]
}

def seed_perfis_por_tipo(db: Session, empresa_id: UUID, tipo: TipoEmpresaEnum):
    templates = TEMPLATE_PERFIS.get(tipo, TEMPLATE_PERFIS[TipoEmpresaEnum.VAREJO])
    criados = []
    for t in templates:
        p = Perfil(empresa_id=empresa_id, nome=t["nome"], slug=t["slug"], permissoes=t["permissoes"], is_system=True)
        db.add(p)
        criados.append(p)
    db.flush()
    emit(str(empresa_id), "perfis:created", data=[{"id": str(c.id), "nome": c.nome, "slug": c.slug} for c in criados])
