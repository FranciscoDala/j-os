from __future__ import annotations
from pathlib import Path
from typing import Any, cast
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
import base64

# apps/api/src/jos_api/core/agt.py -> parents[3] = apps/api
BASE_DIR = Path(__file__).resolve().parents[3]
CERTS_DIR = BASE_DIR / "certs"
PRIVATE_KEY_PATH = CERTS_DIR / "agt_privada.pem"

def _load_private_key() -> rsa.RSAPrivateKey:
    if not PRIVATE_KEY_PATH.exists():
        raise FileNotFoundError(f"Chave privada nao encontrada em: {PRIVATE_KEY_PATH}")
    data = PRIVATE_KEY_PATH.read_bytes()
    key = serialization.load_pem_private_key(data, password=None)
    if not isinstance(key, rsa.RSAPrivateKey):
        raise TypeError("Chave carregada nao e RSA")
    return key

def gerar_hash_agt(texto_para_assinar: str) -> str:
    private_key = _load_private_key()
    assinatura: bytes = private_key.sign(
        data=texto_para_assinar.encode('utf-8'),
        padding=padding.PKCS1v15(),
        algorithm=hashes.SHA256(),
    )
    return base64.b64encode(assinatura).decode('utf-8')

def montar_string_fatura(data_iso: str, numero_fatura: str, total: str, hash_anterior: str) -> str:
    # Formato AGT: DATA;NUMERO;TOTAL;HASH_ANTERIOR
    hash_ant = hash_anterior or ""
    return f"{data_iso};{numero_fatura};{total};{hash_ant}"
