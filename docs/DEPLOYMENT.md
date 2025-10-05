# Guia de Deploy - Ezer DH

## Pré-requisitos

- Node.js 16+ instalado
- MySQL 8.0+ configurado
- Servidor Linux (Ubuntu/CentOS)
- Nginx (opcional, para proxy reverso)

## Configuração do Ambiente

### 1. Instalar dependências

```bash
# Instalar dependências de todos os módulos
npm run install:all
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

### 3. Configurar banco de dados

```bash
# Executar script de criação do banco
mysql -u root -p < database/ezer_dh.sql
```

## Deploy em Produção

### 1. Usando PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start backend/src/app.js --name "ezer-dh-api"

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

### 2. Usando systemd

Criar arquivo `/etc/systemd/system/ezer-dh.service`:

```ini
[Unit]
Description=Ezer DH API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/ezer_dh
ExecStart=/usr/bin/node backend/src/app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Ativar serviço:
```bash
sudo systemctl enable ezer-dh
sudo systemctl start ezer-dh
```

### 3. Configurar Nginx (Opcional)

Criar arquivo `/etc/nginx/sites-available/ezer-dh`:

```nginx
server {
    listen 80;
    server_name ezer-dh.com;

    # Frontend
    location / {
        root /var/www/html/ezer_dh/frontend/public;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar site:
```bash
sudo ln -s /etc/nginx/sites-available/ezer-dh /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoramento

### Logs

```bash
# Ver logs da aplicação
pm2 logs ezer-dh

# Ver logs do sistema
sudo journalctl -u ezer-dh -f
```

### Health Check

```bash
# Verificar status da API
curl http://localhost:3000/api/health

# Verificar status do PM2
pm2 status
```

## Backup

### Banco de dados

```bash
# Backup completo
mysqldump -u root -p ezer_dh > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup apenas estrutura
mysqldump -u root -p --no-data ezer_dh > structure_backup.sql
```

### Arquivos de upload

```bash
# Backup dos uploads
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/public/uploads/
```

## Troubleshooting

### Problemas comuns

1. **Erro de conexão com banco**
   - Verificar credenciais no .env
   - Verificar se MySQL está rodando
   - Verificar firewall

2. **Erro de permissões**
   - Verificar permissões dos diretórios
   - Verificar usuário do processo

3. **Erro de memória**
   - Aumentar limite de memória do Node.js
   - Verificar uso de memória do sistema

### Comandos úteis

```bash
# Verificar uso de memória
free -h

# Verificar processos Node.js
ps aux | grep node

# Verificar portas em uso
netstat -tlnp | grep :3000

# Verificar logs de erro
tail -f /var/log/nginx/error.log
```
