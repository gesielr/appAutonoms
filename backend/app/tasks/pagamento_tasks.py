import logging
import time
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.worker import celery_app
from app.db.database import SessionLocal
from app.db.models import Pagamento, Guia, StatusPagamento
from app.services.pix_service import gerar_qrcode_pix, consultar_status_pix

# Configurar logger
logger = logging.getLogger(__name__)

def gerar_cobranca_pix(pagamento_id: int, guia_id: int, valor: float):
    """
    Tarefa para gerar uma cobrança Pix.
    Esta função é chamada como uma tarefa em segundo plano pela API.
    
    Args:
        pagamento_id: ID do pagamento
        guia_id: ID da guia
        valor: Valor da cobrança
    """
    # Enfileirar a tarefa no Celery
    gerar_cobranca_pix_task.delay(pagamento_id, guia_id, valor)

def verificar_pagamento_pix(pagamento_id: int):
    """
    Tarefa para verificar o status de um pagamento Pix.
    Esta função é chamada como uma tarefa em segundo plano pela API.
    
    Args:
        pagamento_id: ID do pagamento
    """
    # Enfileirar a tarefa no Celery
    verificar_pagamento_pix_task.delay(pagamento_id)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def gerar_cobranca_pix_task(self, pagamento_id: int, guia_id: int, valor: float):
    """
    Tarefa Celery para gerar uma cobrança Pix.
    
    Args:
        pagamento_id: ID do pagamento
        guia_id: ID da guia
        valor: Valor da cobrança
    """
    # Criar sessão do banco de dados
    db = SessionLocal()
    
    try:
        # Buscar pagamento
        pagamento = db.query(Pagamento).filter(Pagamento.id == pagamento_id).first()
        
        if not pagamento:
            logger.error(f"Pagamento {pagamento_id} não encontrado")
            return
        
        logger.info(f"Iniciando geração de cobrança Pix para pagamento {pagamento_id}")
        
        # Gerar TxID único para a cobrança
        txid = str(uuid.uuid4()).replace('-', '')
        
        # Em produção, integrar com API de pagamento real
        # Aqui, simulamos a geração do QR code e payload Pix
        qrcode_url, qrcode_text = gerar_qrcode_pix(
            txid=txid,
            valor=valor,
            descricao=f"Guia INSS - ID: {guia_id}"
        )
        
        # Atualizar pagamento com informações do Pix
        pagamento.txid = txid
        pagamento.qrcode_url = qrcode_url
        pagamento.qrcode_text = qrcode_text
        
        db.commit()
        
        logger.info(f"Cobrança Pix gerada com sucesso para pagamento {pagamento_id}")
        
    except Exception as e:
        logger.error(f"Erro ao gerar cobrança Pix para pagamento {pagamento_id}: {str(e)}")
        db.rollback()
        
        # Tentar novamente em caso de erro
        try:
            self.retry(exc=e)
        except Exception as retry_exc:
            logger.error(f"Falha em todas as tentativas de gerar cobrança Pix para pagamento {pagamento_id}: {str(retry_exc)}")
    
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def verificar_pagamento_pix_task(self, pagamento_id: int):
    """
    Tarefa Celery para verificar o status de um pagamento Pix.
    
    Args:
        pagamento_id: ID do pagamento
    """
    # Criar sessão do banco de dados
    db = SessionLocal()
    
    try:
        # Buscar pagamento
        pagamento = db.query(Pagamento).filter(Pagamento.id == pagamento_id).first()
        
        if not pagamento:
            logger.error(f"Pagamento {pagamento_id} não encontrado")
            return
        
        if pagamento.status == StatusPagamento.PAGO:
            logger.info(f"Pagamento {pagamento_id} já está confirmado")
            return
        
        if not pagamento.txid:
            logger.error(f"Pagamento {pagamento_id} não possui TxID")
            return
        
        logger.info(f"Verificando status do pagamento Pix {pagamento_id}")
        
        # Em produção, consultar API de pagamento real
        # Aqui, simulamos a consulta do status
        status_pix = consultar_status_pix(pagamento.txid)
        
        if status_pix == "PAID":
            # Atualizar status do pagamento
            pagamento.status = StatusPagamento.PAGO
            pagamento.paid_at = datetime.now()
            
            # Atualizar status da guia
            guia = db.query(Guia).filter(Guia.id == pagamento.guia_id).first()
            if guia:
                guia.status = "PAGA_USUARIO"
                guia.data_pagamento_usuario = datetime.now()
            
            db.commit()
            
            logger.info(f"Pagamento {pagamento_id} confirmado com sucesso")
            
            # Enfileirar tarefa para processar o pagamento da guia ao INSS
            from app.tasks.guia_tasks import processar_pagamento_inss
            processar_pagamento_inss.delay(pagamento.guia_id)
        
    except Exception as e:
        logger.error(f"Erro ao verificar status do pagamento {pagamento_id}: {str(e)}")
        db.rollback()
        
        # Tentar novamente em caso de erro
        try:
            self.retry(exc=e)
        except Exception as retry_exc:
            logger.error(f"Falha em todas as tentativas de verificar status do pagamento {pagamento_id}: {str(retry_exc)}")
    
    finally:
        db.close()

@celery_app.task
def verificar_pagamentos_pendentes():
    """
    Tarefa Celery periódica para verificar todos os pagamentos pendentes.
    Esta tarefa é executada periodicamente pelo Celery Beat.
    """
    # Criar sessão do banco de dados
    db = SessionLocal()
    
    try:
        # Buscar todos os pagamentos pendentes
        pagamentos_pendentes = db.query(Pagamento).filter(
            Pagamento.status == StatusPagamento.PENDENTE,
            Pagamento.expires_at > datetime.now()  # Apenas pagamentos não expirados
        ).all()
        
        logger.info(f"Verificando {len(pagamentos_pendentes)} pagamentos pendentes")
        
        # Verificar cada pagamento
        for pagamento in pagamentos_pendentes:
            verificar_pagamento_pix_task.delay(pagamento.id)
        
    except Exception as e:
        logger.error(f"Erro ao verificar pagamentos pendentes: {str(e)}")
    
    finally:
        db.close()
