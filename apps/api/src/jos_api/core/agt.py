# pyright: reportAttributeAccessIssue=false
# pyright: reportCallIssue=false
# pyright: reportGeneralTypeIssues=false
import base64
from pathlib import Path
from typing import Any, cast
import logging

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

logger = logging.getLogger(__name__)

CANDIDATES = [
    Path("apps/api/certs/agt_privada.pem"),
    Path("src/jos_api/core/certs/agt_privada.pem"),
    Path("certs/agt_privada.pem"),
    Path("/app/certs/agt_privada.pem"),
    Path("/app/apps/api/certs/agt_privada.pem"),
]

PRIVATE_KEY: RSAPrivateKey | None = None

for p in CANDIDATES:
    if p.exists():
        try:
            loaded = serialization.load_pem_private_key(p.read_bytes(), password=None)
            if isinstance(loaded, RSAPrivateKey):
                PRIVATE_KEY = loaded
                logger.info(f"[AGT] Chave RSA carregada de: {p.resolve()}")
                break
            else:
                logger.error(f"[AGT] Chave em {p} não é RSA")
        except Exception as e:
            logger.error(f"[AGT] Falha ao ler {p}: {e}")

if PRIVATE_KEY is None:
    logger.warning(f"[AGT] Nenhuma chave RSA encontrada - hash ficará NULL até colocar a chave")

def montar_string_fatura(data_iso: str, numero_fatura: str, total_str: str, hash_anterior: str) -> str:
    return f"{data_iso};{numero_fatura};{total_str};{hash_anterior}"

def gerar_hash_agt(string_para_hash: str) -> str:
    if PRIVATE_KEY is None:
        raise FileNotFoundError("Chave privada AGT não encontrada")
    # cast para Any para o Pylance parar de reclamar do .sign
    key = cast(Any, PRIVATE_KEY)
    signature = key.sign(
        string_para_hash.encode("utf-8"),
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode("utf-8")
