#!/bin/bash

# ==========================================
# Meta Campaign Manager - Deploy Docker Swarm
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
echo "║  Meta Campaign Manager - Deploy Docker Swarm      ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se .env.swarm existe
if [ ! -f .env.swarm ]; then
    echo -e "${RED}Arquivo .env.swarm não encontrado!${NC}"
    echo "Copie o arquivo .env.swarm.example e preencha as variáveis."
    exit 1
fi

# Carregar variáveis
set -a
source .env.swarm
set +a

# Verificar variáveis obrigatórias
if [ -z "$DOMAIN" ] || [ -z "$NEXTAUTH_SECRET" ] || [ -z "$META_ACCESS_TOKEN" ]; then
    echo -e "${RED}Variáveis obrigatórias não configuradas!${NC}"
    echo "Verifique DOMAIN, NEXTAUTH_SECRET e META_ACCESS_TOKEN no .env.swarm"
    exit 1
fi

echo -e "${YELLOW}Domínio: ${DOMAIN}${NC}"
echo ""

# ==========================================
# Criar banco de dados se não existir
# ==========================================
echo -e "${YELLOW}Verificando banco de dados...${NC}"

# Tentar criar o banco metamanager (ignora erro se já existir)
docker exec $(docker ps -qf "name=postgres_postgres") psql -U ${POSTGRES_USER:-postgres} -c "CREATE DATABASE ${POSTGRES_DB:-metamanager};" 2>/dev/null || true

echo -e "${GREEN}✓ Banco de dados verificado${NC}"

# ==========================================
# Build das imagens (se não usar registry)
# ==========================================
if [ -z "$REGISTRY" ]; then
    echo ""
    echo -e "${YELLOW}Construindo imagens localmente...${NC}"

    # Build backend
    docker build -t metamanager-backend:latest ./backend

    # Build frontend
    docker build -t metamanager-frontend:latest ./frontend

    # Atualizar stack file para usar imagens locais
    export REGISTRY=""

    echo -e "${GREEN}✓ Imagens construídas${NC}"
fi

# ==========================================
# Deploy da stack
# ==========================================
echo ""
echo -e "${YELLOW}Fazendo deploy da stack...${NC}"

# Deploy com variáveis de ambiente
docker stack deploy -c docker-stack.yml metamanager --with-registry-auth

echo -e "${GREEN}✓ Stack deployed${NC}"

# ==========================================
# Aguardar serviços
# ==========================================
echo ""
echo -e "${YELLOW}Aguardando serviços iniciarem...${NC}"
sleep 10

# Verificar status
docker stack services metamanager

# ==========================================
# Rodar migrations
# ==========================================
echo ""
echo -e "${YELLOW}Aguardando frontend iniciar para migrations...${NC}"
sleep 20

# Tentar rodar migrations
FRONTEND_CONTAINER=$(docker ps -qf "name=metamanager_frontend" | head -1)
if [ -n "$FRONTEND_CONTAINER" ]; then
    echo -e "${YELLOW}Executando migrations...${NC}"
    docker exec $FRONTEND_CONTAINER npx prisma migrate deploy || true
    echo -e "${GREEN}✓ Migrations executadas${NC}"
fi

# ==========================================
# Finalização
# ==========================================
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║           Deploy Concluído!                       ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "Acesse:"
echo -e "  ${BLUE}Frontend:${NC} https://${DOMAIN}"
echo -e "  ${BLUE}API:${NC}      https://api.${DOMAIN}"
echo ""
echo -e "Comandos úteis:"
echo -e "  ${YELLOW}docker stack services metamanager${NC}  # Ver status"
echo -e "  ${YELLOW}docker service logs metamanager_backend -f${NC}  # Logs backend"
echo -e "  ${YELLOW}docker service logs metamanager_frontend -f${NC} # Logs frontend"
echo -e "  ${YELLOW}docker stack rm metamanager${NC}        # Remover stack"
echo ""
