from jos_api.db.session import SessionLocal
from jos_api.modules.auth.models import User, RoleEnum
from jos_api.core.security import hash_password
import uuid

db = SessionLocal()

# limpa usuários quebrados
db.query(User).delete()
db.commit()

# cria empresa fictícia
empresa_id = uuid.uuid4()

# cria DONO
user = User(
    empresa_id=empresa_id,
    nome="Admin Jenath",
    email="admin@jos.ao",
    senha_hash=hash_password("admin123"),
    role=RoleEnum.DONO,
    ativo=True
)
db.add(user)
db.commit()
db.refresh(user)
print(f"CRIADO: {user.email} / admin123")
print(f"empresa_id: {empresa_id}")
print(f"id: {user.id}")
db.close()
