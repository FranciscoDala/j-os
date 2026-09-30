from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from jos_api.core.config import settings
from jos_api.db.base import Base

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
db_url = db_url.replace("-pooler.", ".").replace("&channel_binding=require","").replace("channel_binding=require","")

engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
