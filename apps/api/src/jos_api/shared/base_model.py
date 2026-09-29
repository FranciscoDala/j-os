import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from jos_api.db.base import Base

def gen_uuid(): return str(uuid.uuid4())

class BaseModel(Base):
    __abstract__ = True
    id = Column(String, primary_key=True, default=gen_uuid)
    
    # OBRIGATÓRIO: Todo dado pertence a uma empresa da Jenath
    empresa_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
