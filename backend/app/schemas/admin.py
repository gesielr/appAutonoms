from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum

from app.schemas.usuario import UsuarioBase
from app.schemas.guia import GuiaBase
from app.schemas.pagamento import PagamentoBase

class DashboardStats(BaseModel):
    """Estatísticas para o dashboard administrativo"""
    total_usuarios: int
    total_guias: int
    guias_por_status: Dict[str, int]
    total_pagamentos: int
    pagamentos_por_status: Dict[str, int]
    valor_total_recebido: float
    valor_total_taxas: float
    guias_ultimos_30_dias: int
    usuarios_ultimos_30_dias: int

class UsuarioAdmin(BaseModel):
    """Informações básicas de usuário para administradores"""
    id: int
    nome: str
    cpf: str
    email: str

class PagamentoAdmin(BaseModel):
    """Informações básicas de pagamento para administradores"""
    id: Optional[int] = None
    status: Optional[str] = None
    valor: Optional[float] = None
    paid_at: Optional[datetime] = None

class GuiaAdmin(BaseModel):
    """Informações básicas de guia para administradores"""
    competencia: str
    categoria: str
    valor_contribuicao: float
    status: str

class AdminGuiaList(BaseModel):
    """Modelo para listagem de guias no painel administrativo"""
    id: int
    usuario: UsuarioAdmin
    competencia: str
    categoria: str
    salario_contribuicao: float
    valor_contribuicao: float
    codigo_pagamento: str
    status: str
    data_vencimento: datetime
    data_pagamento_usuario: Optional[datetime] = None
    data_pagamento_inss: Optional[datetime] = None
    guia_url: Optional[str] = None
    nota_fiscal_url: Optional[str] = None
    created_at: datetime
    pagamento: Optional[PagamentoAdmin] = None

class AdminPagamentoList(BaseModel):
    """Modelo para listagem de pagamentos no painel administrativo"""
    id: int
    guia_id: int
    usuario: UsuarioAdmin
    valor: float
    status: str
    txid: str
    qrcode_url: str
    created_at: datetime
    expires_at: datetime
    paid_at: Optional[datetime] = None
    guia: GuiaAdmin

class AdminAction(BaseModel):
    """Modelo para ações administrativas"""
    message: str
    status: str = "success"
    data: Optional[Dict[str, Any]] = None
