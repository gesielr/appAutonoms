from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from app.db.models import CategoriaContribuinte

# Esquemas para Usuário
class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    cpf: str
    nit_pis: str
    categoria: CategoriaContribuinte

    # Validadores
    @validator('cpf')
    def cpf_deve_ter_11_digitos(cls, v):
        v = v.replace('.', '').replace('-', '')
        if len(v) != 11:
            raise ValueError('CPF deve ter 11 dígitos')
        return v

    @validator('nit_pis')
    def nit_pis_deve_ter_11_digitos(cls, v):
        v = v.replace('.', '').replace('-', '')
        if len(v) != 11:
            raise ValueError('NIT/PIS deve ter 11 dígitos')
        return v

class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6)

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    categoria: Optional[CategoriaContribuinte] = None
    senha: Optional[str] = Field(None, min_length=6)

class UsuarioInDB(UsuarioBase):
    id: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    class Config:
        orm_mode = True

class Usuario(UsuarioInDB):
    pass

# Esquemas para autenticação
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

class LoginRequest(BaseModel):
    cpf: str
    senha: str

    @validator('cpf')
    def cpf_deve_ter_11_digitos(cls, v):
        v = v.replace('.', '').replace('-', '')
        if len(v) != 11:
            raise ValueError('CPF deve ter 11 dígitos')
        return v
