from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.api.deps import authenticate_user
from app.core.config import settings
from app.core.security import create_access_token
from app.db.database import get_db
from app.schemas.usuario import Token, LoginRequest

router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Autentica um usuário e retorna um token de acesso.
    
    Args:
        form_data: Dados de login (CPF e senha)
        db: Sessão do banco de dados
        
    Returns:
        Token de acesso JWT
        
    Raises:
        HTTPException: Se as credenciais forem inválidas
    """
    # Limpar CPF (remover pontos e traços)
    cpf = form_data.cpf.replace('.', '').replace('-', '')
    
    # Autenticar usuário
    user = authenticate_user(db, cpf, form_data.senha)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Criar token de acesso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nome": user.nome,
            "email": user.email,
            "cpf": user.cpf,
            "nit_pis": user.nit_pis,
            "categoria": user.categoria
        }
    }

@router.post("/login/oauth", response_model=Token)
def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Endpoint OAuth2 para autenticação (usado por ferramentas como Swagger UI).
    
    Args:
        form_data: Formulário OAuth2 com username (CPF) e password
        db: Sessão do banco de dados
        
    Returns:
        Token de acesso JWT
        
    Raises:
        HTTPException: Se as credenciais forem inválidas
    """
    # Autenticar usuário (username é o CPF)
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Criar token de acesso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
