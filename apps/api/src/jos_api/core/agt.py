import base64, os
from pathlib import Path
from typing import Any, cast
import logging
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

logger = logging.getLogger(__name__)
PRIVATE_KEY: RSAPrivateKey | None = None

# Tenta do ENV (Render)
b64 = os.getenv("AGT_PRIVATE_KEY_B64")
if b64:
    try:
        pem_bytes = base64.b64decode(b64)
        loaded = serialization.load_pem_private_key(pem_bytes, password=None)
        if isinstance(loaded, RSAPrivateKey):
            PRIVATE_KEY = loaded
            logger.info("[AGT] Chave RSA carregada do ENV")
    except Exception as e:
        logger.error(f"[AGT] Falha ENV: {e}")

# Fallback local arquivo
if PRIVATE_KEY is None:
    for p in [Path(__file__).parent/"certs"/"agt_privada.pem", Path("/app/certs/agt_privada.pem")]:
        if p.exists():
            try:
                loaded = serialization.load_pem_private_key(p.read_bytes(), password=None)
                if isinstance(loaded, RSAPrivateKey):
                    PRIVATE_KEY = loaded
                    logger.info(f"[AGT] Chave carregada de {p}")
                    break
            except: pass

if PRIVATE_KEY is None:
    logger.error("[AGT] NENHUMA CHAVE ENCONTRADA")

def montar_string_fatura(data_iso: str, numero_fatura: str, total_str: str, hash_anterior: str) -> str:
    return f"{data_iso};{numero_fatura};{total_str};{hash_anterior}"

def gerar_hash_agt(s: str) -> str:
    if PRIVATE_KEY is None: raise FileNotFoundError("Chave AGT não encontrada")
    key = cast(Any, PRIVATE_KEY)
    sig = key.sign(s.encode(), padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(sig).decode()
