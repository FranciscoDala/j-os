from jos_api.db.session import SessionLocal
from jos_api.modules.auth.models import User, RoleEnum
from jos_api.core.security import hash_password
import uuid

db = SessionLocal()

# --- NAO limpa tudo se já tens dados em produção ---
# Se quiseres limpar só o superadmin antigo:
db.query(User).filter(User.email.ilike("superadmin@j-os.ao")).delete()
db.commit()

# cria superadmin SEM empresa_id e SEM UserEmpresa
user = User(
    id=uuid.uuid4(),
    empresa_id=None,  # superadmin não tem loja
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
print(f"empresa_id: {user.empresa_id}") # deve ser None

db.close()
