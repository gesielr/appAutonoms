from celery.schedules import crontab
from app.worker import celery_app
from app.core.config import settings

# Configurar tarefas periódicas
celery_app.conf.beat_schedule = {
    # Verificar pagamentos pendentes a cada 5 minutos
    'verificar-pagamentos-pendentes': {
        'task': 'app.tasks.pagamento_tasks.verificar_pagamentos_pendentes',
        'schedule': crontab(minute='*/5'),
    },
    
    # Verificar guias pendentes de pagamento ao INSS diariamente às 9h
    'verificar-guias-pendentes': {
        'task': 'app.tasks.guia_tasks.verificar_guias_pendentes',
        'schedule': crontab(hour=9, minute=0),
    },
    
    # Limpar guias expiradas diariamente à meia-noite
    'limpar-guias-expiradas': {
        'task': 'app.tasks.guia_tasks.limpar_guias_expiradas',
        'schedule': crontab(hour=0, minute=0),
    },
}

# Configurações adicionais para o Beat
celery_app.conf.timezone = 'America/Sao_Paulo'
