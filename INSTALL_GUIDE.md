# Guia de Instalação - Meta Campaign Manager

> Testado em **Ubuntu 24.04 LTS**

## Pré-requisitos

- Docker e Docker Compose instalados
- Traefik configurado como reverse proxy
- PostgreSQL rodando (container ou externo)
- Domínio apontando para o servidor

---

## Instalação do Docker (Ubuntu 24.04)

Se ainda não tem Docker instalado:

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y ca-certificates curl gnupg lsb-release

# Adicionar chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Adicionar repositório
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Adicionar usuário ao grupo docker (evita usar sudo)
sudo usermod -aG docker $USER

# Aplicar mudança de grupo (ou faça logout/login)
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

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

### 4. Comando de Diagnóstico Completo (Ubuntu)

Cole este comando no terminal da VPS para ver todas as informações de uma vez:

```bash
echo "========================================" && \
echo "  DIAGNÓSTICO - Meta Campaign Manager" && \
echo "========================================" && \
echo "" && \
echo ">>> Sistema Operacional:" && \
lsb_release -d && \
echo "" && \
echo ">>> Docker Version:" && \
docker --version && \
echo "" && \
echo ">>> REDES DOCKER:" && \
docker network ls --format "table {{.Name}}\t{{.Driver}}" && \
echo "" && \
echo ">>> CONTAINERS RODANDO:" && \
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" && \
echo "" && \
echo ">>> CONTAINERS POSTGRES:" && \
docker ps -a --format "table {{.Names}}\t{{.Image}}" | grep -i postgres || echo "Nenhum container PostgreSQL encontrado" && \
echo "" && \
echo ">>> CONTAINERS TRAEFIK:" && \
docker ps -a --format "table {{.Names}}\t{{.Image}}" | grep -i traefik || echo "Nenhum container Traefik encontrado" && \
echo "" && \
echo ">>> CERTRESOLVER (de containers existentes):" && \
docker ps --format "{{.Names}}" | head -3 | xargs -I {} sh -c 'docker inspect {} 2>/dev/null | grep -o "certresolver=[^\"]*" | head -1' 2>/dev/null || echo "Não encontrado" && \
echo "" && \
echo "========================================"
```

### 5. Verificar Configurações do PostgreSQL

```bash
# Se PostgreSQL está em container, ver credenciais
docker inspect $(docker ps -qf "ancestor=postgres" | head -1) 2>/dev/null | grep -E "(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)" | head -3

# Ver IP interno do container PostgreSQL
docker inspect $(docker ps -qf "ancestor=postgres" | head -1) 2>/dev/null | grep -o '"IPAddress": "[^"]*"' | head -1
```

### 6. Verificar Configuração do Traefik

```bash
# Ver arquivo de configuração do Traefik (se existir)
sudo find /opt /home /root -name "traefik.yml" -o -name "traefik.toml" 2>/dev/null | head -1 | xargs cat 2>/dev/null

# Ver docker-compose do Traefik
sudo find /opt /home /root -name "docker-compose.yml" -exec grep -l "traefik" {} \; 2>/dev/null | head -1 | xargs cat 2>/dev/null | grep -A 30 "traefik"
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
