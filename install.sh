#!/bin/bash

# ==========================================
# Meta Campaign Manager - Script de Instalação
# Deploy via Docker Swarm + Traefik
# ==========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

if ! docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q "active"; then
    echo -e "${RED}Docker Swarm não está ativo. Execute: docker swarm init${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker e Docker Swarm ativos${NC}"

# ==========================================
# Coletar informações
# ==========================================
echo ""
echo -e "${BLUE}=== Configuração do Domínio ===${NC}"
read -p "Domínio do frontend (ex: app.seudominio.com): " DOMAIN

echo ""
echo -e "${BLUE}=== Configuração do PostgreSQL ===${NC}"
echo -e "${YELLOW}O PostgreSQL deve estar acessível na rede Docker.${NC}"
read -p "Host do PostgreSQL [postgres_postgres]: " POSTGRES_HOST
POSTGRES_HOST=${POSTGRES_HOST:-postgres_postgres}

read -p "Porta do PostgreSQL [5432]: " POSTGRES_PORT
POSTGRES_PORT=${POSTGRES_PORT:-5432}

read -p "Usuário do PostgreSQL [postgres]: " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-postgres}

read -sp "Senha do PostgreSQL: " POSTGRES_PASSWORD
echo ""

read -p "Nome do banco [metamanager]: " POSTGRES_DB
POSTGRES_DB=${POSTGRES_DB:-metamanager}

echo ""
echo -e "${BLUE}=== Configuração do Traefik ===${NC}"
read -p "Nome da rede externa do Traefik [IdevaNet]: " TRAEFIK_NETWORK
TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-IdevaNet}

read -p "Nome do certresolver do Traefik [letsencryptresolver]: " CERTRESOLVER
CERTRESOLVER=${CERTRESOLVER:-letsencryptresolver}

echo ""
echo -e "${BLUE}=== Configuração do LLM (OpenAI/OpenRouter) ===${NC}"
read -p "LLM API Key: " LLM_API_KEY
read -p "LLM Base URL (vazio=OpenAI, OpenRouter=https://openrouter.ai/api/v1): " LLM_BASE_URL
read -p "LLM Model [gpt-4o-mini]: " LLM_MODEL
LLM_MODEL=${LLM_MODEL:-gpt-4o-mini}

echo ""
echo -e "${BLUE}=== OpenAI - Transcrição de Áudio (Whisper) ===${NC}"
read -p "OpenAI API Key (para transcrição de áudio): " OPENAI_API_KEY
read -p "Whisper Model [whisper-1]: " WHISPER_MODEL
WHISPER_MODEL=${WHISPER_MODEL:-whisper-1}

echo ""
echo -e "${BLUE}=== Meta API (opcional - pode configurar via UI depois) ===${NC}"
read -p "Meta Access Token (vazio para pular): " META_ACCESS_TOKEN
read -p "Meta Business ID: " META_BUSINESS_ID
read -p "Meta Ad Account ID (act_xxx): " META_AD_ACCOUNT_ID

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

# Domínio
DOMAIN=${DOMAIN}

# PostgreSQL
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=${POSTGRES_PORT}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}

# NextAuth
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# LLM Provider
LLM_API_KEY=${LLM_API_KEY}
LLM_BASE_URL=${LLM_BASE_URL}
LLM_MODEL=${LLM_MODEL}

# OpenAI - Transcrição de Áudio (Whisper)
OPENAI_API_KEY=${OPENAI_API_KEY}
WHISPER_MODEL=${WHISPER_MODEL}

# Meta API (opcional)
META_ACCESS_TOKEN=${META_ACCESS_TOKEN}
META_BUSINESS_ID=${META_BUSINESS_ID}
META_AD_ACCOUNT_ID=${META_AD_ACCOUNT_ID}
META_API_VERSION=v24.0
EOF

if [[ "$ENABLE_WHATSAPP" == "s" || "$ENABLE_WHATSAPP" == "S" ]]; then
cat >> .env << EOF

# WhatsApp (Evolution API)
EVOLUTION_API_URL=${EVOLUTION_API_URL}
EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
EVOLUTION_INSTANCE=${EVOLUTION_INSTANCE}
EOF
fi

echo -e "${GREEN}✓ Arquivo .env criado${NC}"

# ==========================================
# Atualizar docker-stack.yml com rede e certresolver
# ==========================================
echo -e "${YELLOW}Configurando docker-stack.yml...${NC}"

sed -i.bak "s/IdevaNet/${TRAEFIK_NETWORK}/g" docker-stack.yml
sed -i.bak "s/letsencryptresolver/${CERTRESOLVER}/g" docker-stack.yml
rm -f docker-stack.yml.bak

echo -e "${GREEN}✓ docker-stack.yml configurado${NC}"

# ==========================================
# Verificar rede Docker
# ==========================================
echo ""
echo -e "${YELLOW}Verificando rede Docker...${NC}"

if ! docker network ls | grep -q "${TRAEFIK_NETWORK}"; then
    echo -e "${RED}Rede '${TRAEFIK_NETWORK}' não encontrada.${NC}"
    echo -e "${YELLOW}Crie a rede com: docker network create --driver overlay ${TRAEFIK_NETWORK}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Rede ${TRAEFIK_NETWORK} encontrada${NC}"

# ==========================================
# Build das imagens locais
# ==========================================
echo ""
echo -e "${YELLOW}Construindo imagem do backend...${NC}"
docker build -t metamanager-backend:latest ./backend
echo -e "${GREEN}✓ Backend construído${NC}"

echo ""
echo -e "${YELLOW}Construindo imagem do frontend...${NC}"
docker build \
    --build-arg NEXT_PUBLIC_BACKEND_URL=https://api.${DOMAIN} \
    -t metamanager-frontend:latest \
    ./frontend
echo -e "${GREEN}✓ Frontend construído${NC}"

# ==========================================
# Deploy via Docker Stack
# ==========================================
echo ""
echo -e "${YELLOW}Fazendo deploy da stack...${NC}"

# Exportar variáveis do .env para o shell
# Docker Stack não lê .env automaticamente
export $(grep -v '^#' .env | grep -v '^$' | xargs)

# Deploy usando imagens locais
REGISTRY="" TAG=latest docker stack deploy -c docker-stack.yml metamanager

echo -e "${GREEN}✓ Stack deployed${NC}"

# ==========================================
# Forçar uso das imagens locais
# ==========================================
echo ""
echo -e "${YELLOW}Atualizando serviços para imagens locais...${NC}"
sleep 5

docker service update --image metamanager-backend:latest metamanager_backend
docker service update --image metamanager-frontend:latest metamanager_frontend

echo -e "${GREEN}✓ Serviços atualizados${NC}"

# ==========================================
# Aguardar serviços iniciarem
# ==========================================
echo ""
echo -e "${YELLOW}Aguardando serviços iniciarem...${NC}"

for i in {1..30}; do
    BACKEND_REPLICAS=$(docker service ls --filter name=metamanager_backend --format "{{.Replicas}}" 2>/dev/null)
    FRONTEND_REPLICAS=$(docker service ls --filter name=metamanager_frontend --format "{{.Replicas}}" 2>/dev/null)

    if [[ "$BACKEND_REPLICAS" == "1/1" && "$FRONTEND_REPLICAS" == "1/1" ]]; then
        echo -e "${GREEN}✓ Todos os serviços estão rodando${NC}"
        break
    fi

    if [[ $i -eq 30 ]]; then
        echo -e "${YELLOW}Timeout. Verifique com: docker service ls${NC}"
        break
    fi

    sleep 2
    echo -n "."
done

# ==========================================
# Verificar health
# ==========================================
echo ""
echo -e "${YELLOW}Verificando saúde do backend...${NC}"
sleep 5

if curl -sf https://api.${DOMAIN}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend respondendo${NC}"
else
    echo -e "${YELLOW}Backend ainda pode estar iniciando. Teste manualmente:${NC}"
    echo -e "  curl https://api.${DOMAIN}/health"
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
echo -e "  ${YELLOW}docker service ls${NC}                          # Ver serviços"
echo -e "  ${YELLOW}docker service logs -f metamanager_frontend${NC} # Logs frontend"
echo -e "  ${YELLOW}docker service logs -f metamanager_backend${NC}  # Logs backend"
echo -e "  ${YELLOW}docker stack rm metamanager${NC}                 # Remover stack"
echo ""
echo -e "Para atualizar após mudanças no código:"
echo -e "  ${YELLOW}cd $(pwd)${NC}"
echo -e "  ${YELLOW}docker build -t metamanager-backend:latest ./backend${NC}"
echo -e "  ${YELLOW}docker build --build-arg NEXT_PUBLIC_BACKEND_URL=https://api.${DOMAIN} -t metamanager-frontend:latest ./frontend${NC}"
echo -e "  ${YELLOW}docker service update --image metamanager-backend:latest metamanager_backend${NC}"
echo -e "  ${YELLOW}docker service update --image metamanager-frontend:latest metamanager_frontend${NC}"
echo ""
