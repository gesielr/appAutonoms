from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.api.deps import get_current_user
from app.core.security import get_password_hash
from app.db.database import get_db
from app.db.models import Usuario
from app.schemas.usuario import Usuario as UsuarioSchema, UsuarioCreate, UsuarioUpdate

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UsuarioCreate,
    db: Session = Depends(get_db)
):
    """
    Cria um novo usuário.
    
    Args:
        user_data: Dados do usuário a ser criado
        db: Sessão do banco de dados
        
    Returns:
        Usuário criado
        
    Raises:
        HTTPException: Se o CPF ou email já estiverem em uso
    """
    # Verificar se o CPF já está em uso
    db_user = db.query(Usuario).filter(Usuario.cpf == user_data.cpf).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já está em uso"
        )
    
    # Verificar se o email já está em uso
    db_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já está em uso"
        )
    
    # Criar novo usuário
    try:
        # Gerar hash da senha
        senha_hash = get_password_hash(user_data.senha)
        
        # Criar objeto de usuário
        db_user = Usuario(
            nome=user_data.nome,
            email=user_data.email,
            cpf=user_data.cpf,
            nit_pis=user_data.nit_pis,
            categoria=user_data.categoria,
            senha_hash=senha_hash
        )
        
        # Salvar no banco de dados
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Gerar token de acesso
        from app.core.security import create_access_token
        from datetime import timedelta
        from app.core.config import settings
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(db_user.id)},
            expires_delta=access_token_expires
        )
        
        return {
            "user": {
                "id": db_user.id,
                "nome": db_user.nome,
                "email": db_user.email,
                "cpf": db_user.cpf,
                "nit_pis": db_user.nit_pis,
                "categoria": db_user.categoria
            },
            "token": access_token,
            "token_type": "bearer"
        }
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erro ao criar usuário. Verifique se os dados são válidos."
        )

@router.get("/me", response_model=UsuarioSchema)
def read_users_me(
    current_user: Usuario = Depends(get_current_user)
):
    """
    Retorna os dados do usuário autenticado.
    
    Args:
        current_user: Usuário autenticado
        
    Returns:
        Dados do usuário
    """
    return current_user

@router.put("/profile", response_model=UsuarioSchema)
def update_user_profile(
    user_data: UsuarioUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza o perfil do usuário autenticado.
    
    Args:
        user_data: Dados a serem atualizados
        current_user: Usuário autenticado
        db: Sessão do banco de dados
        
    Returns:
        Usuário atualizado
        
    Raises:
        HTTPException: Se ocorrer um erro ao atualizar o perfil
    """
    # Atualizar dados do usuário
    if user_data.nome is not None:
        current_user.nome = user_data.nome
    
    if user_data.email is not None:
        # Verificar se o email já está em uso por outro usuário
        db_user = db.query(Usuario).filter(
            Usuario.email == user_data.email,
            Usuario.id != current_user.id
        ).first()
        
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está em uso"
            )
            
        current_user.email = user_data.email
    
    if user_data.categoria is not None:
        current_user.categoria = user_data.categoria
    
    if user_data.senha is not None:
        current_user.senha_hash = get_password_hash(user_data.senha)
    
    try:
        # Salvar alterações
        db.commit()
        db.refresh(current_user)
        return current_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erro ao atualizar perfil. Verifique se os dados são válidos."
        )
