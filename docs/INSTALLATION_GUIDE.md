# Guia de Instalação - Configurador 3D TSI

## Pré-requisitos

### Software Necessário

#### Desenvolvimento Local
- **Node.js**: v18.0.0 ou superior
- **Python**: v3.11 ou superior
- **Docker**: v20.0 ou superior
- **Docker Compose**: v2.0 ou superior
- **Git**: v2.30 ou superior

#### Banco de Dados
- **PostgreSQL**: v14 ou superior
- **Redis**: v6.0 ou superior

#### Opcional (para desenvolvimento)
- **VS Code**: Editor recomendado
- **Postman**: Para testes de API
- **pgAdmin**: Interface gráfica para PostgreSQL

### Hardware Recomendado

#### Desenvolvimento
- **CPU**: 4 cores, 2.5GHz+
- **RAM**: 8GB mínimo, 16GB recomendado
- **Armazenamento**: 20GB livres
- **GPU**: Suporte WebGL 2.0

#### Produção
- **CPU**: 8 cores, 3.0GHz+
- **RAM**: 32GB mínimo
- **Armazenamento**: 100GB SSD
- **GPU**: Dedicada para renderização 3D (opcional)

## Instalação Rápida (Docker)

### 1. Clonar o Repositório

```bash
git clone https://github.com/Elton1978/configurador-3d-tsi.git
cd configurador-3d-tsi
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template de configuração
cp .env.example .env

# Editar configurações
nano .env
```

#### Exemplo de .env

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:senha123@db:5432/configurador_tsi
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha123
POSTGRES_DB=configurador_tsi

# Redis
REDIS_URL=redis://redis:6379/0

# API
API_SECRET_KEY=sua-chave-secreta-muito-segura-aqui
API_DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws

# APIs Externas
CORREIOS_API_KEY=sua-chave-correios
CURRENCY_API_KEY=sua-chave-cotacao
RECEITAWS_API_KEY=sua-chave-receita

# Monitoramento
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=admin123

# Segurança
JWT_SECRET_KEY=jwt-secret-key-muito-segura
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
```

### 3. Iniciar Serviços

```bash
# Construir e iniciar todos os serviços
docker-compose up --build -d

# Verificar status
docker-compose ps
```

### 4. Inicializar Banco de Dados

```bash
# Executar migrações
docker-compose exec api python -c "from database import init_db; init_db()"

# Carregar dados iniciais
docker-compose exec api python -c "
import subprocess
subprocess.run(['psql', '-h', 'db', '-U', 'postgres', '-d', 'configurador_tsi', '-f', '/app/database.sql'])
subprocess.run(['psql', '-h', 'db', '-U', 'postgres', '-d', 'configurador_tsi', '-f', '/app/seeds/02-catalog-seed.sql'])
"
```

### 5. Verificar Instalação

```bash
# Verificar API
curl http://localhost:8000/health

# Verificar Frontend
curl http://localhost:5173

# Verificar logs
docker-compose logs -f
```

## Instalação Manual (Desenvolvimento)

### 1. Configurar Backend

```bash
cd api

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar banco de dados local
createdb configurador_tsi
psql configurador_tsi < database.sql
psql configurador_tsi < seeds/02-catalog-seed.sql

# Configurar variáveis de ambiente
export DATABASE_URL="postgresql://postgres:senha@localhost:5432/configurador_tsi"
export REDIS_URL="redis://localhost:6379/0"
export API_SECRET_KEY="sua-chave-secreta"

# Iniciar servidor
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Configurar Frontend

```bash
cd web

# Instalar dependências
npm install

# Configurar variáveis de ambiente
echo "VITE_API_URL=http://localhost:8000" > .env.local
echo "VITE_WS_URL=ws://localhost:8000/ws" >> .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

### 3. Configurar Banco de Dados

#### PostgreSQL

```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar usuário e banco
sudo -u postgres createuser --interactive
sudo -u postgres createdb configurador_tsi

# Configurar acesso
sudo -u postgres psql
ALTER USER postgres PASSWORD 'senha123';
\q
```

#### Redis

```bash
# Instalar Redis (Ubuntu/Debian)
sudo apt install redis-server

# Iniciar serviço
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Testar conexão
redis-cli ping
```

## Configuração de Produção

### 1. Variáveis de Ambiente de Produção

```env
# Produção - Segurança
API_DEBUG=false
API_SECRET_KEY=chave-super-secreta-produção-256-bits
JWT_SECRET_KEY=jwt-chave-super-secreta-produção

# Banco de Dados - Produção
DATABASE_URL=postgresql://user:pass@prod-db:5432/configurador_tsi
REDIS_URL=redis://prod-redis:6379/0

# URLs de Produção
VITE_API_URL=https://api.configurador3d.com
VITE_WS_URL=wss://api.configurador3d.com/ws

# SSL/HTTPS
SSL_CERT_PATH=/etc/ssl/certs/configurador3d.crt
SSL_KEY_PATH=/etc/ssl/private/configurador3d.key

# Monitoramento
SENTRY_DSN=https://sua-chave@sentry.io/projeto
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Performance
WORKERS=4
MAX_CONNECTIONS=100
CACHE_TTL=3600
```

### 2. Docker Compose para Produção

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build: 
      context: ./api
      dockerfile: Dockerfile.prod
    environment:
      - API_DEBUG=false
      - WORKERS=4
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: ./web
      dockerfile: Dockerfile.prod
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
      - web

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: configurador_tsi
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  redis:
    image: redis:6-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

volumes:
  postgres_data:
  redis_data:
```

### 3. Configuração Nginx

```nginx
# nginx/nginx.conf
upstream api_backend {
    server api:8000;
}

upstream web_backend {
    server web:3000;
}

server {
    listen 80;
    server_name configurador3d.com www.configurador3d.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name configurador3d.com www.configurador3d.com;

    ssl_certificate /etc/ssl/configurador3d.crt;
    ssl_certificate_key /etc/ssl/configurador3d.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://web_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://api_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://api_backend/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Arquivos estáticos
    location /static/ {
        alias /app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Modelos 3D
    location /models/ {
        alias /app/static/models/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
}
```

## Configuração de Monitoramento

### 1. Prometheus

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'configurador-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'

  - job_name: 'configurador-web'
    static_configs:
      - targets: ['web:3000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### 2. Grafana Dashboards

```bash
# Importar dashboards pré-configurados
curl -X POST \
  http://admin:admin@localhost:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @grafana/dashboards/configurador-overview.json
```

## Backup e Recuperação

### 1. Script de Backup

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker-compose exec -T db pg_dump -U postgres configurador_tsi > \
  "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup Redis
docker-compose exec -T redis redis-cli --rdb /data/dump_$DATE.rdb

# Backup arquivos estáticos
tar -czf "$BACKUP_DIR/static_backup_$DATE.tar.gz" static/

# Limpeza de backups antigos (manter 30 dias)
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup concluído: $DATE"
```

### 2. Script de Recuperação

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo_backup.sql>"
    exit 1
fi

# Parar serviços
docker-compose stop api web

# Restaurar banco
docker-compose exec -T db psql -U postgres -d configurador_tsi < "$BACKUP_FILE"

# Reiniciar serviços
docker-compose start api web

echo "Restauração concluída"
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps db

# Verificar logs
docker-compose logs db

# Testar conexão
docker-compose exec db psql -U postgres -d configurador_tsi -c "SELECT 1;"
```

#### 2. Frontend Não Carrega

```bash
# Verificar se Node.js está instalado
node --version
npm --version

# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar variáveis de ambiente
cat .env.local
```

#### 3. API Retorna 500

```bash
# Verificar logs da API
docker-compose logs api

# Verificar health check
curl http://localhost:8000/health

# Verificar dependências Python
docker-compose exec api pip list
```

#### 4. Modelos 3D Não Carregam

```bash
# Verificar se arquivos existem
ls -la static/models/

# Verificar permissões
chmod -R 755 static/models/

# Verificar CORS
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:8000/static/models/
```

### Logs e Debugging

#### Ativar Debug Mode

```bash
# Backend
export API_DEBUG=true
docker-compose restart api

# Frontend
echo "VITE_DEBUG=true" >> .env.local
npm run dev
```

#### Verificar Logs Estruturados

```bash
# Logs em tempo real
docker-compose logs -f api | jq '.'

# Filtrar por nível
docker-compose logs api | grep "ERROR"

# Logs específicos por usuário
docker-compose logs api | grep "user_id.*123"
```

## Performance e Otimização

### 1. Otimizações de Banco

```sql
-- Índices para performance
CREATE INDEX CONCURRENTLY idx_projects_user_id ON projects(user_id);
CREATE INDEX CONCURRENTLY idx_project_blocks_project_id ON project_blocks(project_id);
CREATE INDEX CONCURRENTLY idx_audit_log_timestamp ON audit_log(timestamp);

-- Configurações PostgreSQL
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

### 2. Otimizações Redis

```bash
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. Otimizações Frontend

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}
```

## Segurança

### 1. Checklist de Segurança

- [ ] HTTPS configurado com certificado válido
- [ ] Senhas fortes para banco de dados
- [ ] JWT com chaves seguras e rotação
- [ ] CORS configurado adequadamente
- [ ] Rate limiting implementado
- [ ] Logs de auditoria ativados
- [ ] Backup criptografado
- [ ] Firewall configurado
- [ ] Updates de segurança aplicados

### 2. Configuração de Firewall

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 5432/tcp   # PostgreSQL (apenas interno)
sudo ufw deny 6379/tcp   # Redis (apenas interno)
```

### 3. SSL/TLS

```bash
# Gerar certificado Let's Encrypt
sudo certbot --nginx -d configurador3d.com -d www.configurador3d.com

# Renovação automática
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

## Suporte

### Contatos
- **Documentação**: `/docs/`
- **Issues**: GitHub Issues
- **Email**: suporte@configurador3d.com

### Recursos Adicionais
- **Wiki**: Documentação detalhada
- **FAQ**: Perguntas frequentes
- **Changelog**: Histórico de versões
- **Roadmap**: Funcionalidades futuras

---

**Versão**: 1.0.0  
**Última Atualização**: 03/10/2025
