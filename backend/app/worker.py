from celery import Celery
from app.core.config import settings

# Criar aplicação Celery
celery_app = Celery(
    "app_autonomo",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Configurações do Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=False,
    task_track_started=True,
    worker_max_tasks_per_child=1000,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Importar tarefas
celery_app.autodiscover_tasks(["app.tasks"], force=True)
