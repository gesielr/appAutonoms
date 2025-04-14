# Backend - Geração de Guias INSS

API e serviços em Python para automação da geração de guias do INSS.

## Requisitos

- Python 3.9+
- PostgreSQL
- Redis
- Certificado Digital A1 (para produção)

## Instalação

1. Crie um ambiente virtual:
```bash
python -m venv venv
```

2. Ative o ambiente virtual:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
```bash
# Copie o arquivo de exemplo
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. Inicie o servidor:
```bash
uvicorn app.main:app --reload
```

6. Inicie os workers Celery (em outro terminal):
```bash
celery -A app.worker worker --loglevel=info
```

## Estrutura do Projeto

- `/app`: Código principal da aplicação
  - `/api`: Endpoints da API REST
  - `/core`: Configurações e utilitários
  - `/db`: Modelos e conexão com banco de dados
  - `/schemas`: Esquemas Pydantic para validação
  - `/services`: Serviços de negócio
  - `/tasks`: Tarefas assíncronas (Celery)
  - `/automation`: Scripts de automação web (Selenium)
- `/tests`: Testes automatizados
- `/migrations`: Migrações de banco de dados

## Funcionalidades

- API REST para integração com o aplicativo mobile
- Automação web para geração de guias no SAL/eSocial
- Processamento assíncrono de tarefas com Celery
- Integração com APIs de pagamento Pix
- Emissão automatizada de notas fiscais
