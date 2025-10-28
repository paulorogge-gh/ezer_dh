# Ezer Desenvolvimento Humano

Plataforma de gestão de pessoas e desenvolvimento humano.

## Requisitos
- Node.js >= 18
- NPM

## Instalação
```bash
# Instalar dependências de todos os módulos
npm run install:all
```

## Configuração
Crie o arquivo `backend/.env` baseado em `backend/env.example`:
```env
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

Para testes, existe `backend/.env.test` com variáveis mínimas.

## Execução
Use o script de inicialização para subir backend e frontend:
```bash
./start.sh
```
Frontend estará em `http://localhost:8080` e API em `http://localhost:8000`.

### Health Check
```bash
curl http://localhost:8000/api/health
```

## Estrutura
- `backend/src/app.js`: servidor Express, CORS, logs, health
- `backend/src/routes/index.js`: agregador de rotas `/api/*`
- `backend/src/utils/constants.js`: constantes únicas do sistema
- `frontend/server.js`: servidor estático do frontend

## Logs
Logs de requisição, resposta e erro aplicados em endpoints críticos.

## Deploy
Veja `docs/DEPLOYMENT.md` para configuração de Nginx e PM2.



