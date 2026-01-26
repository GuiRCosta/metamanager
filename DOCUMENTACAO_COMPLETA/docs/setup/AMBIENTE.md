# Configuração do Ambiente de Desenvolvimento

Este guia detalha passo a passo como configurar seu ambiente de desenvolvimento para criar uma aplicação completa de gerenciamento de campanhas Meta.

---

## 📋 Checklist de Instalação

- [ ] Node.js 18+ instalado
- [ ] Python 3.11+ instalado
- [ ] PostgreSQL ou conta Supabase
- [ ] Git instalado
- [ ] Editor de código (VS Code recomendado)
- [ ] Meta Developer Account criada

---

## 1. Instalação do Node.js

### macOS

```bash
# Usando Homebrew (recomendado)
brew install node@18

# Verificar instalação
node --version  # Deve mostrar v18.x ou superior
npm --version   # Deve mostrar 9.x ou superior
```

### Linux (Ubuntu/Debian)

```bash
# Instalar via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### Windows

1. Baixe o instalador em: https://nodejs.org/
2. Execute o instalador (.msi)
3. Abra PowerShell e verifique: `node --version`

---

## 2. Instalação do Python

### macOS

```bash
# Usando Homebrew
brew install python@3.11

# Criar alias (adicione ao ~/.zshrc ou ~/.bash_profile)
alias python=python3
alias pip=pip3

# Verificar instalação
python --version  # Deve mostrar Python 3.11.x
pip --version
```

### Linux (Ubuntu/Debian)

```bash
# Instalar Python 3.11
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Verificar instalação
python3.11 --version
pip3 --version
```

### Windows

1. Baixe o instalador em: https://www.python.org/downloads/
2. **IMPORTANTE**: Marque "Add Python to PATH" durante instalação
3. Execute o instalador
4. Abra PowerShell e verifique: `python --version`

---

## 3. Configuração do Git

```bash
# Instalar Git (se não estiver instalado)
# macOS
brew install git

# Linux
sudo apt install git

# Windows: baixe de https://git-scm.com/

# Configurar usuário
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Verificar configuração
git config --list
```

---

## 4. PostgreSQL / Supabase

### Opção A: Supabase (Recomendado - Mais Fácil)

Supabase é uma alternativa gratuita ao Firebase que oferece PostgreSQL gerenciado.

#### Passo a Passo Supabase

1. **Criar conta**: https://supabase.com/
2. **Criar novo projeto**:
   - Nome do projeto: `meta-campaigns`
   - Database password: Crie uma senha forte (anote!)
   - Região: Escolha a mais próxima
3. **Obter credenciais**:
   - Vá em: Settings → Database
   - Copie a **Connection String** (formato Pooler)
   - Exemplo: `postgresql://postgres.xxx:senha@aws-0-us-west-2.pooler.supabase.com:6543/postgres`

4. **URL encoding da senha**:
   Se sua senha contém caracteres especiais (@, #, !, etc.), você precisa codificá-los:

   ```bash
   # Exemplo: senha "IDEVA@go2025" vira "IDEVA%40go2025"
   @ → %40
   # → %23
   ! → %21
   $ → %24
   ```

5. **Duas URLs necessárias**:
   ```bash
   # Pooler (porta 6543) - para queries normais
   DATABASE_URL="postgresql://postgres.xxx:senha@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Direct (porta 5432) - para migrations
   DIRECT_URL="postgresql://postgres.xxx:senha@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
   ```

### Opção B: PostgreSQL Local

Se preferir instalar localmente:

#### macOS
```bash
brew install postgresql@15
brew services start postgresql@15

# Criar banco de dados
createdb meta_campaigns
```

#### Linux
```bash
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário e banco
sudo -u postgres psql
CREATE DATABASE meta_campaigns;
CREATE USER seu_usuario WITH ENCRYPTED PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE meta_campaigns TO seu_usuario;
\q
```

#### Windows
1. Baixe instalador: https://www.postgresql.org/download/windows/
2. Execute instalador
3. Use Stack Builder para pgAdmin (GUI opcional)

---

## 5. Meta Developer Account

### Criar Meta App

1. **Acesse**: https://developers.facebook.com/
2. **Login** com sua conta Facebook/Meta
3. **Criar App**:
   - Clique em "My Apps" → "Create App"
   - Tipo: "Business"
   - Display name: "Meta Campaign Manager"
   - Contact email: seu email

4. **Adicionar Marketing API**:
   - Dashboard do App → Add Product
   - Selecione "Marketing API"
   - Settings → Basic → copie:
     - App ID
     - App Secret

5. **Gerar Access Token**:
   - Tools → Graph API Explorer
   - Selecione seu app
   - Permissões necessárias:
     - `ads_management`
     - `ads_read`
     - `business_management`
   - Clique em "Generate Access Token"
   - **IMPORTANTE**: Copie e salve o token (não será mostrado novamente)

6. **Obter Ad Account ID**:
   - Meta Business Suite: https://business.facebook.com/
   - Settings → Ad Accounts
   - Copie o ID (formato: `act_123456789`)

---

## 6. VS Code (Editor Recomendado)

### Instalação

Baixe em: https://code.visualstudio.com/

### Extensões Essenciais

Instale essas extensões no VS Code:

```bash
# Abrir VS Code
code .

# Instalar extensões via CLI
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
```

Ou instale manualmente:
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formatação de código
- **Tailwind CSS IntelliSense** - Autocomplete Tailwind
- **Prisma** - Syntax highlighting para Prisma
- **Python** - Suporte Python
- **Pylance** - Type checking Python

### Configurações VS Code Recomendadas

Crie `.vscode/settings.json` no projeto:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

---

## 7. Criar Estrutura do Projeto

```bash
# Criar diretório principal
mkdir meta-campaign-manager
cd meta-campaign-manager

# Criar estrutura de pastas
mkdir -p frontend backend docs

# Inicializar Git
git init
echo "node_modules/" > .gitignore
echo "venv/" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

---

## 8. Configurar Frontend (Next.js)

```bash
cd frontend

# Criar projeto Next.js
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Instalar dependências principais
npm install @prisma/client next-auth@beta
npm install zod react-hook-form @hookform/resolvers
npm install recharts lucide-react
npm install sonner  # Toast notifications

# Instalar dependências de desenvolvimento
npm install -D prisma
npm install -D @types/node @types/react @types/react-dom

# Instalar shadcn/ui
npx shadcn-ui@latest init

# Adicionar componentes shadcn/ui necessários
npx shadcn-ui@latest add button card input label select table badge progress
npx shadcn-ui@latest add dialog dropdown-menu sheet skeleton toast
```

### Criar arquivo .env.local

```bash
# frontend/.env.local
# Copie e preencha com suas credenciais

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aqui-gere-com-openssl-rand-base64-32

# Database (Supabase)
DATABASE_URL="postgresql://postgres.xxx:senha@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:senha@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Backend API
AGNO_API_URL=http://localhost:8000
```

---

## 9. Configurar Backend (FastAPI)

```bash
cd ../backend

# Criar ambiente virtual Python
python3.11 -m venv venv

# Ativar ambiente virtual
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Instalar dependências
pip install fastapi uvicorn[standard]
pip install httpx pydantic-settings python-dotenv
pip install openai  # Se usar IA Agent

# Criar requirements.txt
pip freeze > requirements.txt
```

### Criar arquivo .env

```bash
# backend/.env
# Copie e preencha com suas credenciais

# Meta API
META_ACCESS_TOKEN=seu-token-meta-aqui
META_AD_ACCOUNT_ID=act_123456789
META_PAGE_ID=123456789

# OpenAI (se usar IA Agent)
OPENAI_API_KEY=sk-proj-xxx

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Database (mesmo do frontend)
DATABASE_URL="postgresql://postgres.xxx:senha@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### Criar script de configuração (env.config.sh)

```bash
# backend/env.config.sh
#!/bin/bash

# Carregar variáveis de ambiente
export $(cat .env | xargs)

echo "✅ Variáveis de ambiente carregadas!"
echo "   META_AD_ACCOUNT_ID: $META_AD_ACCOUNT_ID"
echo "   PORT: $PORT"
```

```bash
# Dar permissão de execução
chmod +x env.config.sh
```

---

## 10. Verificar Instalação

### Teste Frontend

```bash
cd frontend

# Verificar instalação
npm --version
node --version

# Iniciar servidor de desenvolvimento
npm run dev

# Deve abrir em: http://localhost:3000
```

### Teste Backend

```bash
cd backend

# Ativar venv
source venv/bin/activate

# Carregar variáveis
source env.config.sh

# Iniciar servidor
uvicorn app.main:app --reload --port 8000

# Deve abrir em: http://localhost:8000
# Docs automáticas em: http://localhost:8000/docs
```

---

## 11. Troubleshooting Comum

### Problema: "command not found: node"

**Solução**:
```bash
# Verificar se Node está no PATH
echo $PATH

# Adicionar ao PATH (macOS/Linux)
export PATH="/usr/local/bin:$PATH"

# Reiniciar terminal
```

### Problema: "Python version not found"

**Solução**:
```bash
# Verificar Python instalado
which python3
which python3.11

# Usar versão específica
python3.11 -m venv venv
```

### Problema: "Connection refused" no PostgreSQL

**Solução Supabase**:
1. Verifique se a senha está URL-encoded
2. Use porta 6543 para DATABASE_URL
3. Use porta 5432 para DIRECT_URL
4. Teste conexão: https://supabase.com/dashboard/project/xxx/settings/database

**Solução Local**:
```bash
# Verificar se PostgreSQL está rodando
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Iniciar se necessário
brew services start postgresql@15
# ou
sudo systemctl start postgresql
```

### Problema: "Module not found" no Next.js

**Solução**:
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Reiniciar servidor
npm run dev
```

### Problema: Meta API retorna erro 400/401

**Solução**:
1. Verifique se o Access Token é válido
2. Confirme permissões (`ads_management`, `ads_read`)
3. Verifique se Ad Account ID está correto (formato: `act_123456789`)
4. Use Graph API Explorer para testar: https://developers.facebook.com/tools/explorer/

---

## 12. Próximos Passos

Agora que seu ambiente está configurado:

1. ✅ **[Visão Geral da Arquitetura](../arquitetura/VISAO_GERAL.md)** - Entenda como tudo funciona
2. ✅ **[Banco de Dados e Schema](../database/README.md)** - Configure o Prisma e crie tabelas
3. ✅ **[Backend com FastAPI](../backend/README.md)** - Construa a API
4. ✅ **[Frontend com Next.js](../frontend/README.md)** - Construa a interface

---

## 📝 Checklist Final

Antes de continuar, certifique-se que:

- [ ] Node.js e npm funcionam: `node --version && npm --version`
- [ ] Python funciona: `python --version`
- [ ] Git funciona: `git --version`
- [ ] Banco de dados acessível (Supabase ou local)
- [ ] Meta App criado e Access Token obtido
- [ ] Frontend inicia sem erros: `npm run dev`
- [ ] Backend inicia sem erros: `uvicorn app.main:app --reload`
- [ ] Arquivos .env criados e preenchidos

---

🎉 **Parabéns! Seu ambiente está pronto!** Continue para [Visão Geral da Arquitetura](../arquitetura/VISAO_GERAL.md).
