from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "J-OS"
    API_V1_STR: str = "/api/v1"
    ENV: str = "dev"

    DATABASE_URL: str = "postgresql://neondb_owner:npg_aX14oNTxkmFZ@ep-nameless-hill-b7abkv7r-pooler.c-13.us-east-1.aws.neon.tech/jenath-db?sslmode=require&channel_binding=require"

    SECRET_KEY: str = "J-OS_JENATH_2026_SUPER_SECRET_MUDE_EM_PROD_@123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    TEMP_TOKEN_EXPIRE_MINUTES: int = 10

    ALLOWED_ORIGINS: str = "https://jenath.vercel.app,https://jenath-sys.onrender.com,https://j-os.onrender.com,https://jenath-sys.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:5173,http://127.0.0.1:3000"

    BASE_URL: str = "http://localhost:8000"

    CLOUDINARY_CLOUD_NAME: str = "d7dtiurw"
    CLOUDINARY_API_KEY: str = "598914546743518"
    CLOUDINARY_API_SECRET: str = "GxBW2UtKsSr2nDDc0WwztUWU3w8"

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
