# pyright: reportAttributeAccessIssue=false
# pyright: reportCallIssue=false
import base64
from pathlib import Path
from typing import Any, cast
import logging

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

logger = logging.getLogger(__name__)

# caminho absoluto baseado no arquivo atual
THIS_FILE = Path(__file__).resolve()
BASE_DIR = THIS_FILE.parent  # src/jos_api/core

CANDIDATES = [
    BASE_DIR / "certs" / "agt_privada.pem",  # src/jos_api/core/certs/
    BASE_DIR.parent.parent.parent / "certs" / "agt_privada.pem",  # A:\j-os\apps\api\certs
    BASE_DIR.parent.parent.parent.parent / "apps" / "api" / "certs" / "agt_privada.pem",  # A:\j-os\apps\api\certs quando roda de A:\j-os
    Path("apps/api/certs/agt_privada.pem"),
    Path("certs/agt_privada.pem"),
    Path("/app/certs/agt_privada.pem"),
]

PRIVATE_KEY: RSAPrivateKey | None = None
for p in CANDIDATES:
    try:
        rp = p.resolve()
    except Exception:
        rp = p
    if rp.exists():
        try:
            loaded = serialization.load_pem_private_key(rp.read_bytes(), password=None)
            if isinstance(loaded, RSAPrivateKey):
                PRIVATE_KEY = loaded
                logger.info(f"[AGT] Chave RSA carregada de: {rp}")
                break
            else:
                logger.error(f"[AGT] Chave em {rp} não é RSA")
        except Exception as e:
            logger.error(f"[AGT] Falha ao ler {rp}: {e}")
    else:
        logger.debug(f"[AGT] Tentou {rp} - não existe")

if PRIVATE_KEY is None:
    logger.error(f"[AGT] NENHUMA CHAVE ENCONTRADA! Procurei em: {[str(c) for c in CANDIDATES]}")

def montar_string_fatura(data_iso: str, numero_fatura: str, total_str: str, hash_anterior: str) -> str:
    return f"{data_iso};{numero_fatura};{total_str};{hash_anterior}"

def gerar_hash_agt(string_para_hash: str) -> str:
    if PRIVATE_KEY is None:
        raise FileNotFoundError("Chave privada AGT não encontrada")
    key = cast(Any, PRIVATE_KEY)
    signature = key.sign(string_para_hash.encode("utf-8"), padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(signature).decode("utf-8")
