from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings

try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as connection:
        print("✅ Conectado com sucesso ao banco de dados!")
except SQLAlchemyError as e:
    print("❌ Erro ao conectar ao banco:", e)
