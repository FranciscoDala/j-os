# apps/api/generate_keys.py
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import os
from pathlib import Path

# 1. Onde vai ficar - vai criar apps/api/certs/
BASE_DIR = Path(__file__).parent
CERTS_DIR = BASE_DIR / "certs"
CERTS_DIR.mkdir(exist_ok=True)

# 2. Gera o par 2048 bits (exigido pela AGT)
print("A gerar chaves RSA 2048...")
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
public_key = private_key.public_key()

# 3. Formata para PEM
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# 4. Salva os ficheiros
private_path = CERTS_DIR / "agt_privada.pem"
public_path = CERTS_DIR / "agt_publica.pem"

with open(private_path, 'wb') as f:
    f.write(private_pem)

with open(public_path, 'wb') as f:
    f.write(public_pem)

print(f"\n✅ GERADO COM SUCESSO!")
print(f"📁 Pasta: {CERTS_DIR}")
print(f"🔒 Privada (NUNCA ENVIAR / NUNCA COMMIT): {private_path}")
print(f"🔓 Pública (ESSA ANEXAS NA AGT): {public_path}")

# 5. Gera versão para colar no .env
private_for_env = private_pem.decode().replace("\n", "\\n")
print(f"\n--- COPIA ISSO PARA O TEU apps/api/.env ---")
print(f'AGT_PRIVATE_KEY="{private_for_env}"')
print(f'AGT_PUBLIC_KEY_PATH="certs/agt_publica.pem"')
