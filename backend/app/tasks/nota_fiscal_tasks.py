import logging
import time
from datetime import datetime
from sqlalchemy.orm import Session

from app.worker import celery_app
from app.db.database import SessionLocal
from app.db.models import Guia, Usuario
from app.services.nfse_service import emitir_nfse

# Configurar logger
logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=300)
def emitir_nota_fiscal(self, guia_id: int):
    """
    Tarefa Celery para emitir nota fiscal de serviço.
    Esta tarefa é executada após o pagamento da guia ao INSS.
    
    Args:
        guia_id: ID da guia
    """
    # Criar sessão do banco de dados
    db = SessionLocal()
    
    try:
        # Buscar guia e usuário
        guia = db.query(Guia).filter(Guia.id == guia_id).first()
        
        if not guia:
            logger.error(f"Guia {guia_id} não encontrada")
            return
        
        if guia.status != "PAGA_INSS":
            logger.error(f"Guia {guia_id} não está no status correto para emissão de nota fiscal")
            return
        
        # Buscar usuário
        usuario = db.query(Usuario).filter(Usuario.id == guia.usuario_id).first()
        
        if not usuario:
            logger.error(f"Usuário da guia {guia_id} não encontrado")
            return
        
        logger.info(f"Iniciando emissão de nota fiscal para guia {guia_id}")
        
        # Calcular valor da taxa de serviço (10% do valor da contribuição)
        valor_taxa = guia.valor_contribuicao * 0.10
        
        # Emitir nota fiscal via serviço de NFS-e
        # Em produção, integrar com API real (eNotas, NFE.io, etc.)
        nota_fiscal_url = emitir_nfse(
            tomador_nome=usuario.nome,
            tomador_cpf=usuario.cpf,
            tomador_email=usuario.email,
            valor=valor_taxa,
            descricao=f"Serviço de geração de guia de INSS - Competência: {guia.competencia}"
        )
        
        # Atualizar guia com URL da nota fiscal
        guia.nota_fiscal_url = nota_fiscal_url
        
        db.commit()
        
        logger.info(f"Nota fiscal emitida com sucesso para guia {guia_id}")
        
    except Exception as e:
        logger.error(f"Erro ao emitir nota fiscal para guia {guia_id}: {str(e)}")
        db.rollback()
        
        # Tentar novamente em caso de erro
        try:
            self.retry(exc=e)
        except Exception as retry_exc:
            logger.error(f"Falha em todas as tentativas de emitir nota fiscal para guia {guia_id}: {str(retry_exc)}")
    
    finally:
        db.close()
