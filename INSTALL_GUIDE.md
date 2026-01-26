# Guia de Instalação - Meta Campaign Manager

## Pré-requisitos

- Docker e Docker Compose instalados
- Traefik configurado como reverse proxy
- PostgreSQL rodando (container ou externo)
- Domínio apontando para o servidor

---

## Como Encontrar as Informações da VPS

### 1. Rede do Traefik

```bash
# Listar redes Docker
docker network ls

# Resultado esperado (procure por traefik):
# NETWORK ID     NAME             DRIVER
# abc123         traefik-public   bridge
```

O nome da rede geralmente é `traefik-public` ou `traefik`.

### 2. Informações do PostgreSQL

```bash
# Ver containers PostgreSQL
docker ps | grep -i postgres

# Ver variáveis de ambiente do container
docker inspect <nome_container_postgres> | grep -A 20 "Env"

# Ou verificar docker-compose do PostgreSQL
cat /caminho/docker-compose.yml | grep -A 15 postgres
```

### 3. Nome do Certresolver

```bash
# Ver em containers existentes com SSL
docker ps --format "{{.Names}}" | head -5 | xargs -I {} docker inspect {} 2>/dev/null | grep -i certresolver

# Valor comum: letsencrypt
```

### 4. Comando de Diagnóstico Completo

```bash
echo "=== REDES DOCKER ===" && \
docker network ls && \
echo "" && \
echo "=== CONTAINERS POSTGRES ===" && \
docker ps --format "table {{.Names}}\t{{.Image}}" | grep -i postgres
```

---

## Valores Padrão Comuns

| Configuração | Valor Típico |
|--------------|--------------|
| POSTGRES_HOST | `postgres` |
| POSTGRES_PORT | `5432` |
| POSTGRES_USER | `postgres` ou definido por você |
| POSTGRES_DB | nome do banco criado |
| TRAEFIK_NETWORK | `traefik-public` |
| CERTRESOLVER | `letsencrypt` |

---

## Instalação

### Opção 1: Script Automático (Recomendado)

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/metamanager.git
cd metamanager

# Executar instalador
chmod +x install.sh
./install.sh
```

O script irá:
1. Verificar Docker e Docker Compose
2. Solicitar todas as configurações
3. Criar arquivos `.env` automaticamente
4. Gerar chave NextAuth segura
5. Construir e iniciar os containers

### Opção 2: Instalação Manual

1. **Criar arquivo `.env` na raiz:**

```env
DOMAIN=app.seudominio.com

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=metamanager

# NextAuth (gere com: openssl rand -base64 32)
NEXTAUTH_SECRET=chave_gerada_aqui
```

2. **Criar arquivo `backend/.env`:**

```env
# Meta API
META_ACCESS_TOKEN=seu_token_meta
META_BUSINESS_ID=seu_business_id
META_AD_ACCOUNT_ID=act_xxx
META_API_VERSION=v24.0

# OpenAI
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL=gpt-4o-mini

# Frontend URL
FRONTEND_URL=https://app.seudominio.com

# WhatsApp (opcional)
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE=nome_da_instancia
```

3. **Atualizar docker-compose.yml:**

Edite o arquivo e substitua:
- `traefik-public` pelo nome da sua rede Traefik
- `letsencrypt` pelo nome do seu certresolver

4. **Build e Deploy:**

```bash
docker compose build
docker compose up -d
```

---

## Verificação Pós-Instalação

### Health Check

```bash
# Backend
curl https://api.seudominio.com/health
# Esperado: {"status": "healthy"}

# Frontend
curl -I https://seudominio.com
# Esperado: HTTP/2 200
```

### Logs

```bash
# Ver todos os logs
docker compose logs -f

# Apenas backend
docker compose logs -f backend

# Apenas frontend
docker compose logs -f frontend
```

---

## Comandos Úteis

```bash
# Reiniciar serviços
docker compose restart

# Parar serviços
docker compose down

# Rebuild com cache limpo
docker compose build --no-cache

# Ver status dos containers
docker compose ps
```

---

## Solução de Problemas

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs backend
docker compose logs frontend
```

### Erro de conexão com PostgreSQL

1. Verifique se o host está correto (nome do container ou IP)
2. Confirme que o PostgreSQL aceita conexões externas
3. Verifique se a rede Docker está correta

### SSL não funciona

1. Confirme que o domínio aponta para o servidor
2. Verifique o nome do certresolver
3. Veja logs do Traefik: `docker logs traefik`

### Migrations falham

```bash
# Executar migrations manualmente
docker compose exec frontend npx prisma migrate deploy
```

---

## Suporte

- Issues: https://github.com/seu-usuario/metamanager/issues
