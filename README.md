# J-OS — Jenath Operating System

> O sistema operacional que roda todas as empresas da Jenath Investimentos em um só lugar.

J-OS é um monólito modular em monorepo que centraliza a operação de Restaurante, Segurança, Prestação de Serviços, Financeiro e RH. Cada empresa da Jenath é um tenant isolado, mas o dono tem visão 360º de tudo.

### Por que existe?

A Jenath hoje usa 5 planilhas, 3 cadernos e WhatsApp pra gerir tudo. O J-OS substitui isso por um único sistema com controle de acesso, financeiro real e app para o funcionário na rua.

### Stack

**Backend:** FastAPI (Python 3.11) + SQLAlchemy + Alembic + PostgreSQL + JWT
**Web (Painel do Dono):** Next.js 14 + Tailwind + shadcn/ui
**Mobile (App do Funcionário):** React Native + Expo Router
**Infra:** Docker Compose + pnpm workspaces + Turborepo (opcional)

### Arquitetura - Monólito Modular


------------------------------------------------------------------------------------------------------------------------------------------

**Regra de Ouro:** Um módulo nunca importa código de outro módulo. A comunicação é via `api/v1` ou via eventos. Isso evita o monólito virar spaghetti.

### Módulos

| Módulo | O que faz | Quem acessa |
|---|---|---|
| **auth** | Login, JWT, refresh token | Todos |
| **tenants** | Empresas da Jenath, filiais | Dono |
| **restaurante** | Cardápio, pedidos, cozinha, mesas | Garçom, Cozinha, Gerente |
| **seguranca** | Escalas, rondas, ocorrências, postos | Vigilante, Supervisor |
| **servicos** | Ordens de serviço, clientes, contratos | Técnico, Gerente |
| **financeiro** | Caixa, entradas/saídas, DRE por tenant | Dono (vê tudo), Gerente (vê só o seu) |
| **rh** | Funcionários, ponto, salários, documentos | Dono, RH |

### Segurança e Multiempresa

1.  **Tenant Isolation:** Todo `BaseModel` tem `empresa_id`. Toda query é filtrada por `empresa_id` no `core/tenant.py`.
2.  **RBAC por Ação:** Não é `is_admin`. É `can:financeiro:read`, `can:restaurante:create_pedido`. Definido em `core/permissions.py`.
3.  **Financeiro Vê Tudo:** Regra explícita `if user.has_permission('financeiro:read_all')` e não exceção informal.

Nunca confie no `empresa_id` vindo do frontend. Ele vem do JWT.

### Como Rodar Local

Pré-requisito: Docker, Node 20+, pnpm, Python 3.11

```bash
# 1. Clonar
git clone https://github.com/jenath/j-os.git
cd j-os

# 2. Subir Banco e API
docker-compose -f infra/docker-compose.yml up -d --build

# 3. Rodar migrations
cd apps/api
alembic upgrade head
# ou: python -m alembic upgrade head

# 4. Rodar Web (Painel)
cd ../web
pnpm install
pnpm dev # http://localhost:3000

# 5. Rodar Mobile
cd ../mobile
pnpm install
pnpm start







# ativar o .env
    cd A:\j-os\apps\api
    .\venv\Scripts\Activate.ps1

# subir o frontend:
    pnpm dev

# subir o backend:

    # estando em A:\j-os\apps\api com (venv) ativo:
    pip install -e .
    # agora tenta
    uvicorn jos_api.main:app --reload --port 8000


    # Windows CMD
    set PYTHONPATH=src
    uvicorn jos_api.main:app --reload --port 8000

    # Se for PowerShell
    $env:PYTHONPATH="src"
    uvicorn jos_api.main:app --reload --port 8000





# subir o projecto no git
    # 1. Inicia
        git init

    # 2. Vê o que tem
        git status

    # 3. Cria .gitignore se não tem (na raiz A:\j-os\.gitignore)

    # 4. Adiciona tudo
        git add .

    # 5. Primeiro commit
        git commit -m "primeiro commit j-os: api + web funcionando local"

    # 6. Cria repo no GitHub (vai em github.com > New repository > j-os > Create SEM README)

    # 7. Conecta (troca SEU_USER)
        git branch -M main
        git remote add origin https://github.com/SEU_USER/j-os.git

    # 8. Sobe
        git push -u origin main
