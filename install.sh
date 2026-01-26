#!/bin/bash

# ==========================================
# Meta Campaign Manager - Script de Instalação
# ==========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║     Meta Campaign Manager - Instalação            ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ==========================================
# Verificar pré-requisitos
# ==========================================
echo -e "${YELLOW}Verificando pré-requisitos...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Instale o Docker primeiro.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose não encontrado.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker e Docker Compose instalados${NC}"

# ==========================================
# Coletar informações
# ==========================================
echo ""
echo -e "${BLUE}=== Configuração do Domínio ===${NC}"
read -p "Domínio (ex: app.seudominio.com): " DOMAIN

echo ""
echo -e "${BLUE}=== Configuração do PostgreSQL ===${NC}"
read -p "Host do PostgreSQL [postgres]: " POSTGRES_HOST
POSTGRES_HOST=${POSTGRES_HOST:-postgres}

read -p "Porta do PostgreSQL [5432]: " POSTGRES_PORT
POSTGRES_PORT=${POSTGRES_PORT:-5432}

read -p "Usuário do PostgreSQL [metamanager]: " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-metamanager}

read -sp "Senha do PostgreSQL: " POSTGRES_PASSWORD
echo ""

read -p "Nome do banco [metamanager]: " POSTGRES_DB
POSTGRES_DB=${POSTGRES_DB:-metamanager}

echo ""
echo -e "${BLUE}=== Configuração do Traefik ===${NC}"
read -p "Nome da rede do Traefik [traefik-public]: " TRAEFIK_NETWORK
TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-traefik-public}

read -p "Nome do certresolver [letsencrypt]: " CERTRESOLVER
CERTRESOLVER=${CERTRESOLVER:-letsencrypt}

echo ""
echo -e "${BLUE}=== Configuração da Meta API ===${NC}"
read -p "Meta Access Token: " META_ACCESS_TOKEN
read -p "Meta Business ID: " META_BUSINESS_ID
read -p "Meta Ad Account ID (act_xxx): " META_AD_ACCOUNT_ID

echo ""
echo -e "${BLUE}=== Configuração do LLM (OpenAI/OpenRouter) ===${NC}"
read -p "LLM API Key: " LLM_API_KEY
read -p "LLM Base URL (vazio=OpenAI, OpenRouter=https://openrouter.ai/api/v1): " LLM_BASE_URL
read -p "LLM Model [gpt-4o-mini]: " LLM_MODEL
LLM_MODEL=${LLM_MODEL:-gpt-4o-mini}

echo ""
echo -e "${BLUE}=== WhatsApp (opcional) ===${NC}"
read -p "Habilitar WhatsApp? (s/n) [n]: " ENABLE_WHATSAPP
if [[ "$ENABLE_WHATSAPP" == "s" || "$ENABLE_WHATSAPP" == "S" ]]; then
    read -p "Evolution API URL: " EVOLUTION_API_URL
    read -p "Evolution API Key: " EVOLUTION_API_KEY
    read -p "Evolution Instance: " EVOLUTION_INSTANCE
fi

# ==========================================
# Gerar chave NextAuth
# ==========================================
echo ""
echo -e "${YELLOW}Gerando chave NextAuth...${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓ Chave gerada${NC}"

# ==========================================
# Criar arquivo .env
# ==========================================
echo ""
echo -e "${YELLOW}Criando arquivo .env...${NC}"

cat > .env << EOF
# Gerado automaticamente em $(date)
DOMAIN=${DOMAIN}

# PostgreSQL
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=${POSTGRES_PORT}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}

# NextAuth
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
EOF

echo -e "${GREEN}✓ Arquivo .env criado${NC}"

# ==========================================
# Criar arquivo backend/.env
# ==========================================
echo -e "${YELLOW}Criando arquivo backend/.env...${NC}"

cat > backend/.env << EOF
# Gerado automaticamente em $(date)

# Meta API (opcional - pode configurar via UI em /settings)
META_ACCESS_TOKEN=${META_ACCESS_TOKEN}
META_BUSINESS_ID=${META_BUSINESS_ID}
META_AD_ACCOUNT_ID=${META_AD_ACCOUNT_ID}
META_API_VERSION=v24.0

# LLM Provider (OpenAI, OpenRouter, ou qualquer API compatível)
LLM_API_KEY=${LLM_API_KEY}
LLM_BASE_URL=${LLM_BASE_URL}
LLM_MODEL=${LLM_MODEL}
LLM_WHISPER_MODEL=whisper-1

# Frontend URL
FRONTEND_URL=https://${DOMAIN}
EOF

if [[ "$ENABLE_WHATSAPP" == "s" || "$ENABLE_WHATSAPP" == "S" ]]; then
cat >> backend/.env << EOF

# WhatsApp (Evolution API)
EVOLUTION_API_URL=${EVOLUTION_API_URL}
EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
EVOLUTION_INSTANCE=${EVOLUTION_INSTANCE}
EOF
fi

echo -e "${GREEN}✓ Arquivo backend/.env criado${NC}"

# ==========================================
# Atualizar docker-compose com rede correta
# ==========================================
echo -e "${YELLOW}Atualizando docker-compose.yml...${NC}"

sed -i.bak "s/traefik-public/${TRAEFIK_NETWORK}/g" docker-compose.yml
sed -i.bak "s/certresolver=letsencrypt/certresolver=${CERTRESOLVER}/g" docker-compose.yml
rm -f docker-compose.yml.bak

echo -e "${GREEN}✓ docker-compose.yml atualizado${NC}"

# ==========================================
# Verificar/criar rede
# ==========================================
echo ""
echo -e "${YELLOW}Verificando rede Docker...${NC}"

if ! docker network ls | grep -q "${TRAEFIK_NETWORK}"; then
    echo -e "${YELLOW}Rede ${TRAEFIK_NETWORK} não encontrada.${NC}"
    read -p "Deseja criar? (s/n) [s]: " CREATE_NETWORK
    CREATE_NETWORK=${CREATE_NETWORK:-s}
    if [[ "$CREATE_NETWORK" == "s" || "$CREATE_NETWORK" == "S" ]]; then
        docker network create ${TRAEFIK_NETWORK}
        echo -e "${GREEN}✓ Rede criada${NC}"
    fi
else
    echo -e "${GREEN}✓ Rede ${TRAEFIK_NETWORK} encontrada${NC}"
fi

# ==========================================
# Build e deploy
# ==========================================
echo ""
echo -e "${YELLOW}Construindo imagens Docker...${NC}"
docker compose build

echo ""
echo -e "${YELLOW}Iniciando containers...${NC}"
docker compose up -d

# ==========================================
# Aguardar health check
# ==========================================
echo ""
echo -e "${YELLOW}Aguardando serviços iniciarem...${NC}"
sleep 10

# Verificar status
if docker compose ps | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend está saudável${NC}"
else
    echo -e "${YELLOW}Aguardando mais um pouco...${NC}"
    sleep 20
fi

# ==========================================
# Finalização
# ==========================================
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║           Instalação Concluída!                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "Acesse:"
echo -e "  ${BLUE}Frontend:${NC} https://${DOMAIN}"
echo -e "  ${BLUE}API:${NC}      https://api.${DOMAIN}"
echo ""
echo -e "Comandos úteis:"
echo -e "  ${YELLOW}docker compose logs -f${NC}     # Ver logs"
echo -e "  ${YELLOW}docker compose restart${NC}    # Reiniciar"
echo -e "  ${YELLOW}docker compose down${NC}       # Parar"
echo ""
