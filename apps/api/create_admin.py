from jos_api.db.session import SessionLocal
from jos_api.modules.auth.models import User, RoleEnum
from jos_api.core.security import hash_password
from sqlalchemy import text
import uuid

db = SessionLocal()

# 1. FORÇA o Postgres a aceitar SUPERADMIN (se já existir, ignora erro)
try:
    db.execute(text("ALTER TYPE roleenum ADD VALUE 'SUPERADMIN'"))
    db.commit()
    print("Enum SUPERADMIN adicionado no banco.")
except Exception as e:
    db.rollback()
    print(f"Enum já existia ou erro ignorado: {e}")

# 2. Limpa superadmin antigo
db.query(User).filter(User.email.ilike("superadmin@j-os.ao")).delete()
db.commit()

# 3. Cria superadmin IGUAL ao dono que deu certo, mas sem empresa
user = User(
    id=uuid.uuid4(),
    empresa_id=None,  # superadmin não tem empresa_id
    nome="Francisco Dala",
    email="superadmin@j-os.ao",
    senha_hash=hash_password("Super@123"),
    role=RoleEnum.SUPERADMIN,
    ativo=True
)
db.add(user)
db.commit()

print(f"\n=== SUPERADMIN CRIADO ===")
print(f"Email: superadmin@j-os.ao")
print(f"Senha: Super@123")
print(f"user_id: {user.id}")
print(f"role: {user.role}")

db.close()
