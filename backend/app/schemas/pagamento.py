from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db.models import StatusPagamento

# Esquemas para Pagamento
class PagamentoBase(BaseModel):
    guia_id: int
    valor: float

class PagamentoCreate(PagamentoBase):
    pass

class PagamentoUpdate(BaseModel):
    status: Optional[StatusPagamento] = None
    qrcode_url: Optional[str] = None
    qrcode_text: Optional[str] = None
    txid: Optional[str] = None
    paid_at: Optional[datetime] = None

class PagamentoInDB(PagamentoBase):
    id: int
    qrcode_url: Optional[str] = None
    qrcode_text: Optional[str] = None
    txid: Optional[str] = None
    status: StatusPagamento
    created_at: datetime
    expires_at: datetime
    paid_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Pagamento(PagamentoInDB):
    pass

class PagamentoStatus(BaseModel):
    id: int
    status: StatusPagamento
