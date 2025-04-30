from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import Usuario, Guia, Pagamento, StatusGuia, StatusPagamento
from app.schemas.pagamento import Pagamento as PagamentoSchema, PagamentoStatus
from app.tasks.pagamento_tasks import gerar_cobranca_pix, verificar_pagamento_pix
from pydantic import BaseModel

# Modelo para webhook de pagamento Pix
class PaymentWebhook(BaseModel):
    status: str

router = APIRouter()

@router.get("/{guia_id}", response_model=PagamentoSchema)
def get_payment_details(
    guia_id: int,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna os detalhes de pagamento para uma guia específica.
    Se o pagamento ainda não existir, cria uma nova cobrança Pix.
    
    Args:
        guia_id: ID da guia
        background_tasks: Tarefas em segundo plano
        current_user: Usuário autenticado
        db: Sessão do banco de dados
        
    Returns:
        Detalhes do pagamento
        
    Raises:
        HTTPException: Se a guia não for encontrada ou não pertencer ao usuário
    """
    # Buscar guia
    guia = db.query(Guia).filter(
        Guia.id == guia_id,
        Guia.usuario_id == current_user.id
    ).first()
    
    if not guia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guia não encontrada"
        )
    
    # Verificar se a guia está pronta para pagamento
    if guia.status != StatusGuia.PAGAMENTO_PENDENTE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Guia não está disponível para pagamento. Status atual: {guia.status}"
        )
    
    # Verificar se já existe um pagamento para esta guia
    pagamento = db.query(Pagamento).filter(Pagamento.guia_id == guia_id).first()
    
    # Se não existir pagamento ou se o pagamento expirou, criar um novo
    if not pagamento or pagamento.expires_at < datetime.now():
        if pagamento:
            # Se existe um pagamento expirado, atualizar para um novo
            db.delete(pagamento)
            db.commit()
        
        # Criar novo pagamento
        novo_pagamento = Pagamento(
            guia_id=guia_id,
            valor=guia.valor_total,
            status=StatusPagamento.PENDENTE,
            expires_at=datetime.now() + timedelta(hours=24)  # Expira em 24 horas
        )
        
        db.add(novo_pagamento)
        db.commit()
        db.refresh(novo_pagamento)
        
        # Enfileirar tarefa para gerar cobrança Pix
        background_tasks.add_task(
            gerar_cobranca_pix,
            pagamento_id=novo_pagamento.id,
            guia_id=guia_id,
            valor=guia.valor_total
        )
        
        return novo_pagamento
    
    # Se o pagamento já estiver pago, retornar
    if pagamento.status == StatusPagamento.PAGO:
        return pagamento
    
    # Se o pagamento ainda estiver pendente e não expirou, verificar status
    background_tasks.add_task(
        verificar_pagamento_pix,
        pagamento_id=pagamento.id
    )
    
    return pagamento

@router.get("/{guia_id}/status", response_model=PagamentoStatus)
def get_payment_status(
    guia_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifica o status atual do pagamento de uma guia.
    
    Args:
        guia_id: ID da guia
        current_user: Usuário autenticado
        db: Sessão do banco de dados
        
    Returns:
        Status do pagamento
        
    Raises:
        HTTPException: Se a guia ou o pagamento não forem encontrados
    """
    # Verificar se a guia pertence ao usuário
    guia = db.query(Guia).filter(
        Guia.id == guia_id,
        Guia.usuario_id == current_user.id
    ).first()
    
    if not guia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guia não encontrada"
        )
    
    # Buscar pagamento
    pagamento = db.query(Pagamento).filter(Pagamento.guia_id == guia_id).first()
    
    if not pagamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado para esta guia"
        )
    
    # Verificar se o pagamento expirou
    if pagamento.status == StatusPagamento.PENDENTE and pagamento.expires_at < datetime.now():
        return {"id": pagamento.id, "status": "EXPIRADO"}
    
    return {"id": pagamento.id, "status": pagamento.status}

@router.post("/{guia_id}/webhook", status_code=status.HTTP_200_OK)
async def payment_webhook(
    guia_id: int,
    payload: PaymentWebhook,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Webhook para receber notificações de pagamento Pix.
    Este endpoint é chamado pelo provedor de pagamento quando o status do Pix muda.
    
    Args:
        guia_id: ID da guia
        payload: Dados do webhook
        background_tasks: Tarefas em segundo plano
        db: Sessão do banco de dados
        
    Returns:
        Confirmação de recebimento
    """
    # Buscar pagamento
    pagamento = db.query(Pagamento).filter(Pagamento.guia_id == guia_id).first()
    
    if not pagamento:
        return {"message": "Pagamento não encontrado"}
    
    # Verificar se o pagamento foi confirmado
    # A estrutura exata do payload depende do provedor de pagamento
    if payload.status == "PAID":
        # Atualizar status do pagamento
        pagamento.status = StatusPagamento.PAGO
        pagamento.paid_at = datetime.now()
        
        # Atualizar status da guia
        guia = db.query(Guia).filter(Guia.id == guia_id).first()
        if guia:
            guia.status = StatusGuia.PAGA_USUARIO
            guia.data_pagamento_usuario = datetime.now()
        
        db.commit()
        
        # Enfileirar tarefa para processar o pagamento da guia ao INSS
        from app.tasks.guia_tasks import processar_pagamento_inss
        background_tasks.add_task(
            processar_pagamento_inss,
            guia_id=guia_id
        )
    
    return {"message": "Webhook recebido com sucesso"}
