from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from src.jos_api.core.config import settings

# Pega a URL e limpa ela aqui mesmo
db_url = settings.DATABASE_URL

# Troca pra psycopg2 (estável no Windows) e remove channel_binding
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

db_url = db_url.replace("&channel_binding=require", "").replace("channel_binding=require&", "").replace("channel_binding=require", "")
db_url = db_url.replace("?sslmode=require&", "?sslmode=require").replace("&&", "&")
# Garante que termina com sslmode
if "sslmode" not in db_url:
    db_url += "?sslmode=require" if "?" not in db_url else "&sslmode=require"

# Troca pooler pra direto (sem -pooler) pra DNS nunca falhar
db_url = db_url.replace("-pooler.", ".")

print(f"[DB] Conectando em: {db_url.split('@')[-1][:40]}...")

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    pool_recycle=60,
    pool_timeout=30,
    connect_args={"connect_timeout": 10}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
