from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from app.api.routes import auth, users, guides, payments, admin
from app.core.config import settings

# Carregar variáveis de ambiente
load_dotenv()

# Criar aplicação FastAPI
app = FastAPI(
    title="API de Geração de Guias INSS",
    description="API para automação de geração de guias do INSS para contribuintes individuais, domésticos e facultativos",
    version="1.0.0"
)

# Configurar CORS
origins = os.getenv("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(users.router, prefix="/users", tags=["Usuários"])
app.include_router(guides.router, prefix="/guides", tags=["Guias"])
app.include_router(payments.router, prefix="/payments", tags=["Pagamentos"])
app.include_router(admin.router, prefix="/admin", tags=["Administração"])

# Rota de verificação de saúde
@app.get("/health", tags=["Saúde"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

# Tratamento de exceções
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
    )

# Inicialização
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
