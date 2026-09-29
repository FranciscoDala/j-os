import uuid
import io
import imghdr
import cloudinary
import cloudinary.uploader
from cloudinary import CloudinaryImage
from fastapi import HTTPException, UploadFile
from jos_api.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

ALLOWED_IMAGE = {"jpg", "jpeg", "png", "webp"}
MAX_IMAGE = 2 * 1024 * 1024 # 2MB
MAX_FILE = 5 * 1024 * 1024 # 5MB

async def upload_image(file: UploadFile, empresa_id: str, folder: str = "produtos") -> str:
    """
    Upload seguro - sempre com empresa_id pra não vazar entre empresas da Jenath
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Arquivo sem nome")

    contents = await file.read()

    if not contents or len(contents) > MAX_IMAGE:
        raise HTTPException(status_code=400, detail="Imagem inválida ou maior que 2MB")

    kind = imghdr.what(None, h=contents)
    if kind not in ALLOWED_IMAGE and kind!= "jpeg":
        raise HTTPException(status_code=400, detail="Arquivo não é imagem válida")

    # ID único + nome limpo
    nome_limpo = file.filename.rsplit('.', 1)[0][:30]
    public_id = f"{uuid.uuid4().hex[:8]}_{nome_limpo}"

    try:
        res = cloudinary.uploader.upload(
            contents,
            folder=f"j-os/{empresa_id}/{folder}",
            public_id=public_id,
            resource_type="image",
            overwrite=False,
            access_mode="public"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha upload imagem: {e}")

    return CloudinaryImage(res["public_id"]).build_url(fetch_format="auto", quality="auto")

async def upload_comprovante(file: UploadFile, empresa_id: str) -> str:
    """
    Para faltas, atestados, recibos - aceita PDF e imagem
    """
    contents = await file.read()

    if not contents or len(contents) < 10:
        raise HTTPException(status_code=400, detail="Arquivo vazio")
    if len(contents) > MAX_FILE:
        raise HTTPException(status_code=400, detail="Arquivo maior que 5MB")

    is_pdf = contents[:5] == b'%PDF-' or (file.filename or "").lower().endswith(".pdf")

    try:
        res = cloudinary.uploader.upload(
            io.BytesIO(contents),
            folder=f"j-os/{empresa_id}/comprovantes",
            resource_type="raw" if is_pdf else "image",
            type="upload",
            access_mode="public",
            use_filename=True,
            unique_filename=True,
        )
        url = res.get("secure_url")
        if not url:
            raise HTTPException(status_code=502, detail="Cloudinary não retornou URL")

        return url
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Falha ao enviar comprovante")
