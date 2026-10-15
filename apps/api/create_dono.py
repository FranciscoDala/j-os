from jos_api.db.session import SessionLocal
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.modules.empresa.models import Empresa, TipoEmpresaEnum
from jos_api.core.security import hash_password
import uuid

db = SessionLocal()

# limpa
db.query(UserEmpresa).delete()
db.query(User).delete()
db.query(Empresa).delete()
db.commit()

# cria empresa CORRETA
empresa_id = uuid.uuid4()
empresa = Empresa(
    id=empresa_id,
    nome_fantasia="J-OS Matriz",
    cnpj="00000000000100",
    tipo=TipoEmpresaEnum.VAREJO
)
db.add(empresa)
db.commit()
print(f"Empresa criada: {empresa_id} - {empresa.nome_fantasia}")

# cria dono
user = User(
    id=uuid.uuid4(),
    empresa_id=empresa_id,
    nome="Admin Jenath",
    email="admin@jos.ao",
    senha_hash=hash_password("admin123"),
    role=RoleEnum.DONO,
    ativo=True
)
db.add(user)
db.flush()

# vinculo OBRIGATORIO pro login funcionar
db.add(UserEmpresa(
    user_id=user.id,
    empresa_id=empresa_id,
    role=RoleEnum.DONO
))
db.commit()

print(f"\n=== PRONTO ===")
print(f"Email: admin@jos.ao")
print(f"Senha: admin123")
print(f"empresa_id: {empresa_id}")
print(f"user_id: {user.id}")
db.close()
