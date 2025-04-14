# Aplicativo de Geração de Guias do INSS

Este projeto consiste em um aplicativo React Native integrado a um backend Python que automatiza a geração de guias de contribuição do INSS para contribuintes individuais (autônomos), empregadores domésticos ou contribuintes facultativos.

## Estrutura do Projeto

- `/mobile`: Aplicativo React Native com Expo
- `/backend`: API e serviços Python (FastAPI, Selenium, Celery)
- `/docs`: Documentação adicional

## Tecnologias Utilizadas

### Frontend (React Native)
- Expo CLI
- React Native Paper para UI
- Axios para requisições
- React Navigation para navegação
- Expo Clipboard para manipulação da área de transferência
- AsyncStorage para armazenamento local

### Backend (Python)
- FastAPI para API
- Selenium para automação web do SAL (Sistema de Acréscimos Legais)
- Celery/Redis para processamento assíncrono
- PostgreSQL para banco de dados
- JWT para autenticação
- Pydantic para validação de dados

## Fluxo da Aplicação

1. Usuário se cadastra (nome, CPF, NIT/PIS, email)
2. Escolhe categoria (Individual, Doméstico, Facultativo)
3. Backend acessa SAL/eSocial e gera guia PDF
4. Sistema gera cobrança Pix (valor + 10% taxa)
5. Após pagamento, contabilidade paga a guia
6. Sistema emite NFS-e para a taxa de serviço

## Funcionalidades Implementadas

### Autenticação e Usuários
- Cadastro de usuários com validação de dados
- Login com geração de token JWT
- Armazenamento seguro de credenciais
- Perfil de usuário com informações para geração de guias

### Geração de Guias
- Solicitação de guias para contribuintes individuais
- Cálculo automático de valores de contribuição
- Processamento assíncrono para geração de guias
- Automação web para acessar o SAL e gerar guias oficiais
- Armazenamento e visualização de guias geradas

### Pagamentos
- Geração de QR Code Pix para pagamento da taxa de serviço
- Monitoramento automático do status de pagamento
- Confirmação de pagamento e processamento da guia
- Emissão automática de nota fiscal após pagamento

### Tarefas Assíncronas
- Processamento em segundo plano com Celery
- Verificação periódica de pagamentos pendentes
- Processamento automático de pagamentos de guias ao INSS
- Emissão automática de notas fiscais

## Configuração e Instalação

### Requisitos
- Node.js e npm
- Python 3.8+
- PostgreSQL
- Redis
- Chrome/Chromium (para automação web)

### Backend (FastAPI)
1. Navegue até a pasta do backend:
   ```
   cd backend
   ```

2. Crie e ative um ambiente virtual:
   ```
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```

4. Configure as variáveis de ambiente (crie um arquivo `.env` baseado no `.env.example`)

5. Inicie o servidor:
   ```
   uvicorn app.main:app --reload
   ```

6. Em outro terminal, inicie os workers do Celery:
   ```
   python start_worker.py
   ```

### Frontend (React Native)
1. Navegue até a pasta do mobile:
   ```
   cd mobile
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente (crie um arquivo `.env` baseado no `.env.example`)

4. Inicie o aplicativo:
   ```
   npx expo start
   ```

## Estrutura de Diretórios

### Backend
```
backend/
├── app/
│   ├── api/
│   │   ├── routes/         # Rotas da API
│   │   └── dependencies.py # Dependências da API
│   ├── automation/         # Scripts de automação web
│   ├── core/               # Configurações e segurança
│   ├── db/                 # Modelos e conexão com banco de dados
│   ├── schemas/            # Esquemas Pydantic
│   ├── services/           # Serviços externos (Pix, NFS-e)
│   ├── tasks/              # Tarefas assíncronas do Celery
│   ├── celerybeat.py       # Configuração do Celery Beat
│   ├── main.py             # Ponto de entrada da aplicação
│   └── worker.py           # Configuração do Celery
├── start_worker.py         # Script para iniciar workers
└── requirements.txt        # Dependências Python
```

### Frontend
```
mobile/
├── src/
│   ├── components/         # Componentes reutilizáveis
│   ├── navigation/         # Configuração de navegação
│   ├── screens/            # Telas do aplicativo
│   │   ├── app/            # Telas principais
│   │   └── auth/           # Telas de autenticação
│   ├── services/           # Serviços (API, armazenamento)
│   ├── utils/              # Utilitários e formatadores
│   └── types.d.ts          # Definições de tipos TypeScript
├── App.tsx                 # Componente principal
└── package.json            # Dependências JavaScript
```

## Segurança

- Autenticação com JWT
- Senhas armazenadas com hash seguro
- Comunicação criptografada com HTTPS
- Proteção contra CSRF e XSS
- Conformidade com LGPD para dados pessoais

## Próximos Passos

- Implementação de testes automatizados
- Melhorias na interface do usuário
- Suporte a múltiplas competências
- Dashboard administrativo
- Relatórios e estatísticas

## Licença

Este projeto é privado e não possui licença open-source.
