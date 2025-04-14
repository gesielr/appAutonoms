import logging
import time
from datetime import datetime
from sqlalchemy.orm import Session

from app.worker import celery_app
from app.db.database import SessionLocal
from app.db.models import Guia, Usuario, StatusGuia
from app.automation.sal_automation import gerar_guia_sal
from app.automation.esocial_automation import gerar_guia_esocial

# Configurar logger
logger = logging.getLogger(__name__)

def gerar_guia_task(guia_id: int, usuario_id: int):
    """
    Tarefa para gerar uma guia do INSS.
    Esta função é chamada como uma tarefa em segundo plano pela API.
    
    Args:
        guia_id: ID da guia a ser gerada
        usuario_id: ID do usuário que solicitou a guia
    """
    # Enfileirar a tarefa no Celery
    gerar_guia.delay(guia_id, usuario_id)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def gerar_guia(self, guia_id: int, usuario_id: int):
    """
    Tarefa Celery para gerar uma guia do INSS.
    
    Args:
        guia_id: ID da guia a ser gerada
        usuario_id: ID do usuário que solicitou a guia
    """
    # Criar sessão do banco de dados
    db = SessionLocal()
    
    try:
        # Buscar guia e usuário
        guia = db.query(Guia).filter(Guia.id == guia_id).first()
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        
        if not guia or not usuario:
            logger.error(f"Guia {guia_id} ou usuário {usuario_id} não encontrado")
            return
        
        logger.info(f"Iniciando geração da guia {guia_id} para o usuário {usuario.nome}")
        
        # Simular processamento (em produção, isso seria a automação real)
        time.sleep(5)  # Simular tempo de processamento
        
        # Gerar guia de acordo com o tipo
        pdf_url = None
        if guia.tipo == "GPS":
            # Gerar guia GPS via SAL
            pdf_url = gerar_guia_sal(
                usuario.nome,
                usuario.cpf,
                usuario.nit_pis,
                guia.competencia,
                guia.salario_contribuicao,
                guia.codigo_pagamento
            )
        else:
            # Gerar guia DAE via eSocial
            pdf_url = gerar_guia_esocial(
                usuario.nome,
                usuario.cpf,
                usuario.nit_pis,
                guia.competencia,
                guia.salario_contribuicao
            )
        
        # Atualizar guia com URL do PDF e mudar status
        guia.pdf_url = pdf_url
        guia.status = StatusGuia.PAGAMENTO_PENDENTE
        
        db.commit()
        
        logger.info(f"Guia {guia_id} gerada com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao gerar guia {guia_id}: {str(e)}")
        db.rollback()
        
        # Tentar novamente em caso de erro
        try:
            self.retry(exc=e)
        except Exception as retry_exc:
            logger.error(f"Falha em todas as tentativas de gerar guia {guia_id}: {str(retry_exc)}")
    
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3, default_retry_delay=300)
def processar_pagamento_inss(self, guia_id: int):
    """
    Tarefa Celery para processar o pagamento da guia ao INSS.
    Esta tarefa é executada após o usuário pagar a guia via Pix.
    
    Args:
        guia_id: ID da guia a ser paga
    """
    # Criar sessão do banco de dados
    db = SessionLocal()
    
    try:
        # Buscar guia
        guia = db.query(Guia).filter(Guia.id == guia_id).first()
        
        if not guia:
            logger.error(f"Guia {guia_id} não encontrada")
            return
        
        if guia.status != StatusGuia.PAGA_USUARIO:
            logger.error(f"Guia {guia_id} não está no status correto para pagamento ao INSS")
            return
        
        logger.info(f"Iniciando processamento de pagamento ao INSS para guia {guia_id}")
        
        # Simular processamento de pagamento ao INSS
        # Em produção, isso seria a integração com o sistema bancário ou manual
        time.sleep(10)  # Simular tempo de processamento
        
        # Atualizar status da guia
        guia.status = StatusGuia.PAGA_INSS
        guia.data_pagamento_inss = datetime.now()
        
        db.commit()
        
        logger.info(f"Pagamento ao INSS da guia {guia_id} processado com sucesso")
        
        # Enfileirar tarefa para emitir nota fiscal
        from app.tasks.nota_fiscal_tasks import emitir_nota_fiscal
        emitir_nota_fiscal.delay(guia_id)
        
    except Exception as e:
        logger.error(f"Erro ao processar pagamento ao INSS da guia {guia_id}: {str(e)}")
        db.rollback()
        
        # Tentar novamente em caso de erro
        try:
            self.retry(exc=e)
        except Exception as retry_exc:
            logger.error(f"Falha em todas as tentativas de processar pagamento da guia {guia_id}: {str(retry_exc)}")
    
    finally:
        db.close()
