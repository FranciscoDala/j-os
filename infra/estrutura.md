$root = "j-os"

$folders = @(
  "apps/api/src/jos_api/core",
  "apps/api/src/jos_api/db",
  "apps/api/src/jos_api/api/v1",
  "apps/api/src/jos_api/shared",
  "apps/api/src/jos_api/modules/auth",
  "apps/api/src/jos_api/modules/tenants",
  "apps/api/src/jos_api/modules/restaurante",
  "apps/api/src/jos_api/modules/seguranca",
  "apps/api/src/jos_api/modules/servicos",
  "apps/api/src/jos_api/modules/financeiro",
  "apps/api/src/jos_api/modules/rh",
  "apps/api/migrations/versions",
  "apps/api/tests/unit",
  "apps/api/tests/integration",
  "apps/web/src/app/(auth)/login",
  "apps/web/src/app/(dashboard)",
  "apps/web/src/app/(dashboard)/restaurante",
  "apps/web/src/app/(dashboard)/seguranca",
  "apps/web/src/app/(dashboard)/financeiro",
  "apps/web/src/app/(dashboard)/rh",
  "apps/web/src/features",
  "apps/web/src/components/ui",
  "apps/web/src/components/shared",
  "apps/web/src/lib",
  "apps/mobile/app",
  "apps/mobile/src/features/restaurante",
  "apps/mobile/src/features/seguranca",
  "apps/mobile/src/features/financeiro",
  "apps/mobile/src/components",
  "apps/mobile/src/lib",
  "packages/api-client/src",
  "packages/config",
  "packages/design-tokens/src",
  "packages/ui/src",
  "packages/tsconfig",
  "infra",
  "docs",
  ".github/workflows"
)

$files = @(

# API - CORE

  "apps/api/src/jos_api/main.py",
  "apps/api/src/jos_api/__init__.py",
  "apps/api/src/jos_api/core/config.py",
  "apps/api/src/jos_api/core/security.py",
  "apps/api/src/jos_api/core/tenant.py",
  "apps/api/src/jos_api/core/permissions.py",
  "apps/api/src/jos_api/core/exceptions.py",
  "apps/api/src/jos_api/db/session.py",
  "apps/api/src/jos_api/db/base.py",
  "apps/api/src/jos_api/shared/base_model.py",
  "apps/api/src/jos_api/shared/pagination.py",
  "apps/api/src/jos_api/api/v1/api.py",

# MODULOS - PADRÃO repository + service

  "apps/api/src/jos_api/modules/auth/router.py",
  "apps/api/src/jos_api/modules/auth/service.py",
  "apps/api/src/jos_api/modules/auth/repository.py",
  "apps/api/src/jos_api/modules/auth/schemas.py",
  "apps/api/src/jos_api/modules/auth/models.py",

  "apps/api/src/jos_api/modules/tenants/router.py",
  "apps/api/src/jos_api/modules/tenants/service.py",
  "apps/api/src/jos_api/modules/tenants/repository.py",
  "apps/api/src/jos_api/modules/tenants/schemas.py",
  "apps/api/src/jos_api/modules/tenants/models.py",

  "apps/api/src/jos_api/modules/restaurante/router.py",
  "apps/api/src/jos_api/modules/restaurante/service.py",
  "apps/api/src/jos_api/modules/restaurante/repository.py",
  "apps/api/src/jos_api/modules/restaurante/schemas.py",
  "apps/api/src/jos_api/modules/restaurante/models.py",

  "apps/api/src/jos_api/modules/seguranca/router.py",
  "apps/api/src/jos_api/modules/seguranca/service.py",
  "apps/api/src/jos_api/modules/seguranca/repository.py",
  "apps/api/src/jos_api/modules/seguranca/schemas.py",
  "apps/api/src/jos_api/modules/seguranca/models.py",

  "apps/api/src/jos_api/modules/servicos/router.py",
  "apps/api/src/jos_api/modules/servicos/service.py",
  "apps/api/src/jos_api/modules/servicos/repository.py",
  "apps/api/src/jos_api/modules/servicos/schemas.py",
  "apps/api/src/jos_api/modules/servicos/models.py",

  "apps/api/src/jos_api/modules/financeiro/router.py",
  "apps/api/src/jos_api/modules/financeiro/service.py",
  "apps/api/src/jos_api/modules/financeiro/repository.py",
  "apps/api/src/jos_api/modules/financeiro/schemas.py",
  "apps/api/src/jos_api/modules/financeiro/models.py",

  "apps/api/src/jos_api/modules/rh/router.py",
  "apps/api/src/jos_api/modules/rh/service.py",
  "apps/api/src/jos_api/modules/rh/repository.py",
  "apps/api/src/jos_api/modules/rh/schemas.py",
  "apps/api/src/jos_api/modules/rh/models.py",

  "apps/api/migrations/env.py",
  "apps/api/migrations/script.py.mako",
  "apps/api/tests/unit/test_tenant.py",
  "apps/api/tests/integration/test_auth.py",
  "apps/api/pyproject.toml",
  "apps/api/alembic.ini",
  "apps/api/Dockerfile",
  "apps/api/README.md",

  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/page.tsx",
  "apps/web/src/app/(auth)/login/page.tsx",
  "apps/web/src/app/(dashboard)/layout.tsx",
  "apps/web/src/app/(dashboard)/page.tsx",
  "apps/web/src/lib/api.ts",
  "apps/web/package.json",

  "apps/mobile/app/_layout.tsx",
  "apps/mobile/app/index.tsx",
  "apps/mobile/package.json",

  "packages/api-client/src/index.ts",
  "packages/design-tokens/src/colors.ts",
  "packages/config/index.ts",
  "packages/ui/src/button.tsx",
  "packages/tsconfig/base.json",

  "infra/docker-compose.yml",
  "docs/ARCHITECTURE.md",
  ".github/workflows/deploy.yml",
  "pnpm-workspace.yaml",
  "package.json",
  "README.md",
  ".gitignore"
)

if(Test-Path $root){ Remove-Item -Recurse -Force $root }
foreach ($folder in $folders) { New-Item -ItemType Directory -Force -Path "$root/$folder" | Out-Null }
foreach ($file in $files) { New-Item -ItemType File -Force -Path "$root/$file" | Out-Null }

Write-Host "✅ J-OS V2 - ESTRUTURA DE PRODUÇÃO CRIADA em ./$root" -ForegroundColor Green
Get-ChildItem $root -Recurse | Where-Object { !$_.PSIsContainer } | Select-Object FullName
