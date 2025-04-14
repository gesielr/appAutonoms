from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Criar engine do SQLAlchemy
engine = create_engine(settings.DATABASE_URL)

# Criar sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos declarativos
Base = declarative_base()

# Função para obter uma sessão de banco de dados
def get_db():
    """
    Função para obter uma sessão de banco de dados.
    Utilizada como dependência nas rotas da API.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
