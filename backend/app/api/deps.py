from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from app.core.config import settings
from app.core.security import verify_password
from app.db.database import get_db
from app.db.models import Usuario
from app.schemas.usuario import TokenData

# Esquema OAuth2 para autenticação com senha
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Usuario:
    """
    Obtém o usuário atual a partir do token JWT.
    
    Args:
        db: Sessão do banco de dados
        token: Token JWT
        
    Returns:
        Usuário autenticado
        
    Raises:
        HTTPException: Se o token for inválido ou o usuário não existir
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar o token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: Optional[int] = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
        token_data = TokenData(id=user_id)
    except JWTError:
        raise credentials_exception
        
    # Buscar usuário no banco de dados
    user = db.query(Usuario).filter(Usuario.id == token_data.id).first()
    
    if user is None:
        raise credentials_exception
        
    return user

def get_current_admin_user(current_user: Usuario = Depends(get_current_user)):
    """
    Verifica se o usuário atual é um administrador.
    
    Args:
        current_user: Usuário autenticado
        
    Returns:
        Usuário administrador
        
    Raises:
        HTTPException: Se o usuário não for um administrador
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado. Apenas administradores podem acessar este recurso."
        )
    return current_user

def authenticate_user(db: Session, cpf: str, password: str) -> Optional[Usuario]:
    """
    Autentica um usuário verificando CPF e senha.
    
    Args:
        db: Sessão do banco de dados
        cpf: CPF do usuário
        password: Senha do usuário
        
    Returns:
        Usuário autenticado ou None se as credenciais forem inválidas
    """
    # Buscar usuário pelo CPF
    user = db.query(Usuario).filter(Usuario.cpf == cpf).first()
    
    if not user:
        return None
        
    # Verificar senha
    if not verify_password(password, user.senha_hash):
        return None
        
    return user
