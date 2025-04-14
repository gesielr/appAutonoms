import subprocess
import os
import sys
import time
import signal
import logging
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("worker_manager")

# Carregar variáveis de ambiente
load_dotenv()

# Processos
worker_process = None
beat_process = None

def start_worker():
    """Inicia o worker do Celery"""
    global worker_process
    
    logger.info("Iniciando Celery worker...")
    worker_process = subprocess.Popen(
        [
            "celery", 
            "-A", "app.worker.celery_app", 
            "worker", 
            "--loglevel=info",
            "--concurrency=2",
            "-n", "worker@%h"
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    logger.info(f"Celery worker iniciado com PID {worker_process.pid}")
    
    # Iniciar thread para monitorar a saída do worker
    def monitor_output(process):
        for line in process.stdout:
            logger.info(f"[WORKER] {line.strip()}")
    
    import threading
    threading.Thread(target=monitor_output, args=(worker_process,), daemon=True).start()

def start_beat():
    """Inicia o scheduler do Celery (beat)"""
    global beat_process
    
    logger.info("Iniciando Celery beat...")
    beat_process = subprocess.Popen(
        [
            "celery", 
            "-A", "app.worker.celery_app", 
            "beat", 
            "--loglevel=info",
            "--scheduler", "django_celery_beat.schedulers:DatabaseScheduler"
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    logger.info(f"Celery beat iniciado com PID {beat_process.pid}")
    
    # Iniciar thread para monitorar a saída do beat
    def monitor_output(process):
        for line in process.stdout:
            logger.info(f"[BEAT] {line.strip()}")
    
    import threading
    threading.Thread(target=monitor_output, args=(beat_process,), daemon=True).start()

def stop_processes():
    """Para os processos do Celery"""
    global worker_process, beat_process
    
    if worker_process:
        logger.info(f"Parando Celery worker (PID {worker_process.pid})...")
        worker_process.terminate()
        worker_process.wait(timeout=10)
        logger.info("Celery worker parado")
    
    if beat_process:
        logger.info(f"Parando Celery beat (PID {beat_process.pid})...")
        beat_process.terminate()
        beat_process.wait(timeout=10)
        logger.info("Celery beat parado")

def signal_handler(sig, frame):
    """Manipulador de sinais para parar os processos ao receber SIGINT ou SIGTERM"""
    logger.info(f"Recebido sinal {sig}. Parando processos...")
    stop_processes()
    sys.exit(0)

if __name__ == "__main__":
    # Registrar manipuladores de sinais
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Iniciar worker e beat
        start_worker()
        start_beat()
        
        # Manter o script em execução
        logger.info("Processos iniciados. Pressione Ctrl+C para parar.")
        while True:
            time.sleep(1)
            
            # Verificar se os processos ainda estão em execução
            if worker_process and worker_process.poll() is not None:
                logger.error("Celery worker parou inesperadamente. Reiniciando...")
                start_worker()
            
            if beat_process and beat_process.poll() is not None:
                logger.error("Celery beat parou inesperadamente. Reiniciando...")
                start_beat()
                
    except KeyboardInterrupt:
        logger.info("Interrupção de teclado recebida. Parando processos...")
    finally:
        stop_processes()
