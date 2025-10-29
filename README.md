# Ezer Desenvolvimento Humano

Plataforma de gestão de pessoas e desenvolvimento humano.

## Requisitos
- Node.js >= 18
- NPM

## Instalação
```bash
# Instalar dependências do projeto unificado
npm ci
```

## Configuração
Crie o arquivo `.env` na raiz baseado em `.env.example`:
```env
PORT=8000
PORT_API=8000
DB_HOST=<seu_host_azure_mysql>
DB_PORT=3306
DB_USER=<seu_usuario>
DB_PASSWORD=<sua_senha>
DB_NAME=ezer_dh
DB_SSL=true
JWT_SECRET=ezer_dh_secret_key_2025
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:8080
AZURE_STORAGE_CONNECTION_STRING=<sua_connection_string_do_storage>
```

Para testes, crie `.env.test` com variáveis mínimas.

## Execução
Inicie o servidor unificado (backend + frontend estático):
```bash
npm start
# modo desenvolvimento (hot reload):
npm run dev
```
Aplicação estará em `http://localhost:8000` e Health em `http://localhost:8000/api/health`.

### Health Check
```bash
curl http://localhost:8000/api/health
```

## Estrutura
- `src/server.js`: servidor Express unificado, CORS, logs, health, rotas `/api/*` e páginas estáticas de `public/`
- `src/routes/index.js`: agregador de rotas `/api/*`
- `src/utils/logger.js`: logger, middleware de request e handler de erros

## Logs
Logs de requisição, resposta e erro aplicados em endpoints críticos.

## Deploy
Veja `docs/DEPLOYMENT.md` para configuração de Nginx e PM2.



