import os
import json
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
from typing import List

# Carregar variáveis de ambiente
load_dotenv()

class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Configurações do Banco de Dados
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/app_autonomo")
    
    # Configurações de Segurança
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Redis (para Celery)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Certificado Digital
    CERTIFICATE_PATH: str = os.getenv("CERTIFICATE_PATH", "")
    CERTIFICATE_PASSWORD: str = os.getenv("CERTIFICATE_PASSWORD", "")
    
    # Configurações de API de Pagamento (Pix)
    PIX_API_KEY: str = os.getenv("PIX_API_KEY", "")
    PIX_API_URL: str = os.getenv("PIX_API_URL", "")
    
    # Configurações de API de Nota Fiscal
    NF_API_KEY: str = os.getenv("NF_API_KEY", "")
    NF_API_URL: str = os.getenv("NF_API_URL", "")
    
    # Path local para armazenamento de PDFs gerados
    PDF_STORAGE_PATH: str = os.getenv("PDF_STORAGE_PATH", "./storage/guias")
    
    # Configurações de CORS
    CORS_ORIGINS: List[str] = json.loads(os.getenv("CORS_ORIGINS", '["http://localhost:3000"]'))
    
    # Modo de Ambiente
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Configuração do modelo usando a nova sintaxe do pydantic-settings
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

# Instância das configurações
settings = Settings()
print("Conectando em:", os.getenv("DATABASE_URL"))
