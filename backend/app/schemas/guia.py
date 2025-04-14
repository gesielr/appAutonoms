from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CategoriaContribuinte(str, Enum):
    """Categorias de contribuintes do INSS"""
    CONTRIBUINTE_INDIVIDUAL = "CONTRIBUINTE_INDIVIDUAL"
    FACULTATIVO = "FACULTATIVO"
    EMPREGADOR_DOMESTICO = "EMPREGADOR_DOMESTICO"

class CodigoPagamento(str, Enum):
    """Códigos de pagamento do INSS"""
    # Contribuinte Individual
    CI_NORMAL = "1007"  # 20%
    CI_LC_123 = "1163"  # 11%
    CI_BAIXA_RENDA = "1120"  # 5%
    
    # Facultativo
    FAC_NORMAL = "1406"  # 20%
    FAC_BAIXA_RENDA = "1473"  # 5%
    FAC_DONA_CASA = "1465"  # 5%
    
    # Empregador Doméstico
    DOM_NORMAL = "1600"  # Empregador doméstico

class GuiaBase(BaseModel):
    competencia: str = Field(..., description="Competência no formato YYYY-MM")
    categoria: CategoriaContribuinte
    salario_contribuicao: float = Field(..., ge=0, description="Valor do salário de contribuição")
    codigo_pagamento: CodigoPagamento
    
    @validator('competencia')
    def validate_competencia(cls, v):
        try:
            ano, mes = v.split('-')
            if not (len(ano) == 4 and len(mes) == 2):
                raise ValueError("Formato de competência inválido")
            if not (1 <= int(mes) <= 12):
                raise ValueError("Mês deve estar entre 1 e 12")
            if not (2000 <= int(ano) <= datetime.now().year):
                raise ValueError("Ano inválido")
        except Exception:
            raise ValueError("Competência deve estar no formato YYYY-MM")
        return v
    
    @validator('salario_contribuicao')
    def validate_salario_contribuicao(cls, v, values):
        # Verificar se o salário está dentro dos limites
        if v < 1100.00:  # Salário mínimo atual
            raise ValueError("Salário de contribuição não pode ser menor que o salário mínimo")
        
        # Teto do INSS (atualizar conforme necessário)
        if v > 7507.49:
            raise ValueError("Salário de contribuição não pode ser maior que o teto do INSS")
        
        return v
    
    @validator('codigo_pagamento')
    def validate_codigo_pagamento(cls, v, values):
        if 'categoria' not in values:
            return v
        
        categoria = values['categoria']
        
        # Verificar se o código de pagamento é compatível com a categoria
        if categoria == CategoriaContribuinte.CONTRIBUINTE_INDIVIDUAL:
            if v not in [CodigoPagamento.CI_NORMAL, CodigoPagamento.CI_LC_123, CodigoPagamento.CI_BAIXA_RENDA]:
                raise ValueError("Código de pagamento inválido para Contribuinte Individual")
        
        elif categoria == CategoriaContribuinte.FACULTATIVO:
            if v not in [CodigoPagamento.FAC_NORMAL, CodigoPagamento.FAC_BAIXA_RENDA, CodigoPagamento.FAC_DONA_CASA]:
                raise ValueError("Código de pagamento inválido para Facultativo")
        
        elif categoria == CategoriaContribuinte.EMPREGADOR_DOMESTICO:
            if v != CodigoPagamento.DOM_NORMAL:
                raise ValueError("Código de pagamento inválido para Empregador Doméstico")
        
        return v

class GuiaCreate(GuiaBase):
    """Modelo para criação de uma guia"""
    pass

class GuiaUpdate(BaseModel):
    """Modelo para atualização de uma guia"""
    status: Optional[str] = None
    guia_url: Optional[str] = None
    data_vencimento: Optional[datetime] = None
    data_pagamento_usuario: Optional[datetime] = None
    data_pagamento_inss: Optional[datetime] = None
    nota_fiscal_url: Optional[str] = None

class GuiaSchema(BaseModel):
    """Modelo completo de uma guia"""
    id: int
    usuario_id: int
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
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class GuiaStatus(BaseModel):
    """Modelo para retorno de status de uma guia"""
    id: int
    status: str
    mensagem: Optional[str] = None

class GuiaList(BaseModel):
    """Modelo para listagem de guias"""
    id: int
    competencia: str
    categoria: str
    salario_contribuicao: float
    valor_contribuicao: float
    codigo_pagamento: str
    status: str
    data_vencimento: datetime
    guia_url: Optional[str] = None
    
    class Config:
        orm_mode = True

class CompetenciaInfo(BaseModel):
    """Informações sobre competências disponíveis"""
    competencia: str
    status: str
    vencimento: datetime

class CompetenciasDisponiveis(BaseModel):
    """Lista de competências disponíveis para geração de guias"""
    competencias: List[CompetenciaInfo]
    
    class Config:
        schema_extra = {
            "example": {
                "competencias": [
                    {
                        "competencia": "2025-04",
                        "status": "ABERTA",
                        "vencimento": "2025-05-15T00:00:00"
                    },
                    {
                        "competencia": "2025-03",
                        "status": "ABERTA",
                        "vencimento": "2025-04-15T00:00:00"
                    }
                ]
            }
        }

class CategoriaInfo(BaseModel):
    """Informações sobre categorias e códigos de pagamento"""
    categoria: CategoriaContribuinte
    nome: str
    descricao: str
    codigos_pagamento: List[dict]

class CategoriasDisponiveis(BaseModel):
    """Lista de categorias disponíveis para geração de guias"""
    categorias: List[CategoriaInfo]
    
    class Config:
        schema_extra = {
            "example": {
                "categorias": [
                    {
                        "categoria": "CONTRIBUINTE_INDIVIDUAL",
                        "nome": "Contribuinte Individual",
                        "descricao": "Autônomos, empresários, etc.",
                        "codigos_pagamento": [
                            {
                                "codigo": "1007",
                                "nome": "Contribuinte Individual - 20%",
                                "descricao": "Alíquota normal de 20%",
                                "aliquota": 0.2
                            },
                            {
                                "codigo": "1163",
                                "nome": "Contribuinte Individual - 11%",
                                "descricao": "Alíquota reduzida para MEI e LC 123",
                                "aliquota": 0.11
                            }
                        ]
                    }
                ]
            }
        }
