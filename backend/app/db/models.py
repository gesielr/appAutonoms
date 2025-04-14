from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime
from app.db.database import Base

# Enums para categorias e status
class CategoriaContribuinte(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    DOMESTICO = "DOMESTICO"
    FACULTATIVO = "FACULTATIVO"

class TipoGuia(str, enum.Enum):
    GPS = "GPS"
    DAE = "DAE"

class StatusGuia(str, enum.Enum):
    GERADA = "GERADA"
    PAGAMENTO_PENDENTE = "PAGAMENTO_PENDENTE"
    PAGA_USUARIO = "PAGA_USUARIO"
    PAGA_INSS = "PAGA_INSS"

class StatusPagamento(str, enum.Enum):
    PENDENTE = "PENDENTE"
    PAGO = "PAGO"

# Modelo de Usuário
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    cpf = Column(String(11), unique=True, index=True, nullable=False)
    nit_pis = Column(String(11), index=True, nullable=False)
    categoria = Column(Enum(CategoriaContribuinte), nullable=False)
    senha_hash = Column(String(100), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    guias = relationship("Guia", back_populates="usuario")

    def __repr__(self):
        return f"<Usuario(id={self.id}, nome='{self.nome}', cpf='{self.cpf}')>"

# Modelo de Guia
class Guia(Base):
    __tablename__ = "guias"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(Enum(TipoGuia), nullable=False)
    competencia = Column(String(7), nullable=False)  # Formato: YYYY-MM
    valor_contribuicao = Column(Float, nullable=False)
    valor_total = Column(Float, nullable=False)  # Valor com 10% de taxa
    status = Column(Enum(StatusGuia), nullable=False, default=StatusGuia.GERADA)
    pdf_url = Column(String(255), nullable=True)
    nota_fiscal_url = Column(String(255), nullable=True)
    data_geracao = Column(DateTime(timezone=True), server_default=func.now())
    data_pagamento_usuario = Column(DateTime(timezone=True), nullable=True)
    data_pagamento_inss = Column(DateTime(timezone=True), nullable=True)
    codigo_pagamento = Column(String(10), nullable=False)
    salario_contribuicao = Column(Float, nullable=False)

    # Relacionamentos
    usuario = relationship("Usuario", back_populates="guias")
    pagamento = relationship("Pagamento", back_populates="guia", uselist=False)

    def __repr__(self):
        return f"<Guia(id={self.id}, tipo='{self.tipo}', competencia='{self.competencia}', status='{self.status}')>"

# Modelo de Pagamento (Pix)
class Pagamento(Base):
    __tablename__ = "pagamentos"

    id = Column(Integer, primary_key=True, index=True)
    guia_id = Column(Integer, ForeignKey("guias.id"), unique=True, nullable=False)
    valor = Column(Float, nullable=False)
    qrcode_url = Column(String(255), nullable=True)
    qrcode_text = Column(Text, nullable=True)
    txid = Column(String(100), nullable=True)
    status = Column(Enum(StatusPagamento), nullable=False, default=StatusPagamento.PENDENTE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    guia = relationship("Guia", back_populates="pagamento")

    def __repr__(self):
        return f"<Pagamento(id={self.id}, guia_id={self.guia_id}, status='{self.status}')>"
