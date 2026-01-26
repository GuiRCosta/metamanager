# 📚 Guia Completo: Como Construir um Sistema de Gerenciamento de Campanhas Meta

> **Documentação educacional completa** para criar uma aplicação full-stack de gerenciamento de campanhas Meta Ads com Next.js, FastAPI e Agentes de IA.

---

## 🎯 O Que É Este Projeto?

Este é um **sistema completo de gerenciamento de campanhas publicitárias** para Meta (Facebook/Instagram) que inclui:

- ✅ Dashboard em tempo real com métricas
- ✅ CRUD completo de campanhas
- ✅ **Sistema de Agentes de IA** para análise e otimização
- ✅ Sincronização com Meta Marketing API
- ✅ Sistema de alertas inteligentes
- ✅ Autenticação segura

---

## 📖 Documentação Completa

### 🚀 Comece Aqui

**[📘 GUIA COMPLETO - Clique aqui para começar!](./docs/GUIA_COMPLETO.md)**

Este guia contém **tudo que você precisa** para criar uma aplicação como esta do zero.

---

### 📚 Índice da Documentação

#### 1. **[⚙️ Configuração do Ambiente](./docs/setup/AMBIENTE.md)**
Instale todas as ferramentas necessárias:
- Node.js, Python, PostgreSQL
- Meta Developer Account
- VS Code e extensões
- Supabase setup
- Troubleshooting comum

#### 2. **[🗄️ Banco de Dados com Prisma](./docs/database/README.md)**
Configure o banco de dados completo:
- Introdução ao Prisma ORM
- Schema completo explicado
- Relacionamentos e migrations
- Queries e operações
- Seed de dados iniciais

#### 3. **[🐍 Backend com FastAPI](./docs/backend/README.md)** ⭐
Construa a API completa com **Agentes de IA**:
- Estrutura do projeto FastAPI
- **Sistema de Agentes especializados:**
  - 🤖 **Campaign Optimizer** - Otimiza campanhas
  - 💰 **Budget Advisor** - Consultoria de orçamento
  - 📊 **Performance Analyst** - Análise de métricas
  - 🎯 **Agent Orchestrator** - Orquestração inteligente
- Endpoints da API
- Rate limiting e segurança

#### 4. **[🔗 Integração com Meta API](./docs/integracao/META_API.md)**
Conecte-se à Meta Marketing API:
- Autenticação e tokens
- Hierarquia (Campaign → Ad Set → Ad)
- CRUD completo de campanhas
- Insights e métricas
- Rate limiting
- Troubleshooting

#### 5. **[⚛️ Frontend com Next.js](./docs/frontend/README.md)** 🚧
_Em breve: Interface completa com React_

#### 6. **[🔒 Autenticação e Segurança](./docs/seguranca/AUTENTICACAO.md)** 🚧
_Em breve: NextAuth, rate limiting, validação_

#### 7. **[🚀 Deploy e Produção](./docs/deploy/PRODUCAO.md)** 🚧
_Em breve: Vercel, Railway, CI/CD_

---

## 🤖 Destaque: Sistema de Agentes de IA

O **diferencial** desta aplicação é o sistema de agentes de IA que trabalham em conjunto:

```
Usuário: "Minhas campanhas estão gastando muito, o que fazer?"
           ↓
┌──────────────────────────────────┐
│   Agent Orchestrator             │
│   (Detecta intenção → Budget)    │
└──────────────┬───────────────────┘
               ↓
┌──────────────────────────────────┐
│   Budget Advisor Agent           │
│   • Analisa distribuição         │
│   • Projeta gasto mensal         │
│   • Sugere realocação            │
└──────────────┬───────────────────┘
               ↓
"Você gastou R$ 2.100 em 15 dias.
Projeção: R$ 4.200/mês (dentro do limite).
Recomendo realocar 20% da campanha X
(ROAS baixo) para campanha Y (alta conversão)."
```

### Agentes Implementados

#### 1. Campaign Optimizer Agent
- Analisa performance em tempo real
- Sugere ajustes de orçamento
- Identifica anúncios ruins
- **Function Calling** para buscar métricas

#### 2. Budget Advisor Agent
- Projeta gastos mensais
- Analisa distribuição de budget
- Sugere realocação
- Alerta sobre overspending

#### 3. Performance Analyst Agent
- Detecta tendências
- Compara campanhas
- Identifica anomalias
- Gera insights acionáveis

**Veja código completo:** [docs/backend/README.md#sistema-de-agentes-de-ia](./docs/backend/README.md#sistema-de-agentes-de-ia)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│           FRONTEND (Next.js 15)         │
│  • Dashboard com métricas               │
│  • Interface de chat com IA             │
│  • Gerenciamento de campanhas           │
└────────────────┬────────────────────────┘
                 │ API REST
                 ↓
┌─────────────────────────────────────────┐
│          BACKEND (FastAPI)              │
│  • Endpoints REST                       │
│  • 🤖 Agentes de IA:                   │
│    - Campaign Optimizer                 │
│    - Budget Advisor                     │
│    - Performance Analyst                │
│  • Proxy para Meta API                  │
└────────────┬────────────┬───────────────┘
             │            │
             │            │ Meta Marketing API v24.0
             │            ↓
             │    ┌──────────────┐
             │    │  Meta Graph  │
             │    │     API      │
             │    └──────────────┘
             │
             │ Prisma ORM
             ↓
┌─────────────────────────────────────────┐
│      DATABASE (PostgreSQL/Supabase)     │
│  • users, campaigns, metrics            │
│  • alerts, settings                     │
└─────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Frontend
- Next.js 15, TypeScript, Tailwind CSS
- shadcn/ui, Recharts, Zod
- NextAuth.js, Prisma Client

### Backend
- FastAPI, Python 3.11+
- OpenAI API (agentes), httpx
- Pydantic (validação)

### Database & Infra
- PostgreSQL 15, Prisma ORM
- Supabase (recomendado)
- Meta Marketing API v24.0

---

## 🚀 Quick Start

### 1. Clone e Configure

```bash
# Clone
git clone <seu-repo>
cd meta-campaign-manager

# Frontend
cd frontend
npm install
cp .env.example .env.local
# Edite .env.local

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edite .env
```

### 2. Configure Banco de Dados

```bash
cd frontend
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Inicie os Servidores

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev
# → http://localhost:3000

# Terminal 2 - Backend
cd backend
source env.config.sh
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs (API docs)
```

---

## 📖 Como Usar a Documentação

### Para Iniciantes

1. Leia o [Guia Completo](./docs/GUIA_COMPLETO.md) primeiro
2. Siga a [Configuração do Ambiente](./docs/setup/AMBIENTE.md)
3. Configure o [Banco de Dados](./docs/database/README.md)
4. Construa o [Backend](./docs/backend/README.md)
5. Integre com a [Meta API](./docs/integracao/META_API.md)

### Para Desenvolvedores

- Foque no [Sistema de Agentes](./docs/backend/README.md#sistema-de-agentes-de-ia)
- Veja a [Integração Meta API](./docs/integracao/META_API.md)
- Explore o [Schema Prisma](./docs/database/README.md#schema-completo)

---

## 📁 Estrutura do Projeto

```
meta/
├── frontend/                    # Next.js App
│   ├── src/
│   │   ├── app/                # App Router
│   │   │   ├── (dashboard)/   # Páginas protegidas
│   │   │   ├── api/           # API Routes
│   │   │   └── login/
│   │   ├── components/        # Componentes React
│   │   ├── lib/              # Utilidades
│   │   └── types/
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
│
├── backend/                    # FastAPI App
│   ├── app/
│   │   ├── api/              # Endpoints
│   │   ├── agents/           # 🤖 Agentes de IA
│   │   │   ├── base_agent.py
│   │   │   ├── campaign_optimizer.py
│   │   │   ├── budget_advisor.py
│   │   │   └── performance_analyst.py
│   │   ├── tools/            # Meta API, etc.
│   │   └── main.py
│   └── requirements.txt
│
└── docs/                       # 📚 Documentação
    ├── GUIA_COMPLETO.md       # Índice geral
    ├── setup/                 # Configuração
    ├── database/              # Prisma
    ├── backend/               # FastAPI + Agentes
    ├── integracao/            # Meta API
    ├── frontend/              # Next.js
    ├── seguranca/             # Auth
    └── deploy/                # Deploy
```

---

## 🎓 Conceitos Aprendidos

Ao completar este guia, você vai dominar:

### Backend
- ✅ FastAPI e APIs assíncronas
- ✅ **Agentes de IA com Function Calling**
- ✅ Integração com APIs externas (Meta)
- ✅ Pydantic para validação
- ✅ Rate limiting e segurança

### Frontend
- ✅ Next.js 15 App Router
- ✅ Server vs Client Components
- ✅ NextAuth.js autenticação
- ✅ Prisma ORM
- ✅ shadcn/ui componentes

### Arquitetura
- ✅ Separação Frontend/Backend
- ✅ API REST design
- ✅ Database design e relacionamentos
- ✅ Sistema de agentes especializados
- ✅ Integração com APIs terceiros

---

## 🤝 Contribuindo

Encontrou um erro ou tem sugestão?

1. Abra uma [Issue](https://github.com/seu-usuario/meta-campaign-manager/issues)
2. Envie um [Pull Request](https://github.com/seu-usuario/meta-campaign-manager/pulls)
3. Compartilhe com outros desenvolvedores!

---

## 📚 Recursos Adicionais

### Documentações Oficiais
- [Next.js](https://nextjs.org/docs)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Prisma](https://www.prisma.io/docs)
- [OpenAI API](https://platform.openai.com/docs)

### Tutoriais
- [Next.js App Router](https://nextjs.org/docs/app)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)

---

## 📞 Suporte

Precisa de ajuda?

- 📖 Leia a [Documentação Completa](./docs/GUIA_COMPLETO.md)
- 🐛 [Reporte Bugs](https://github.com/seu-usuario/meta-campaign-manager/issues)
- 💬 [Discussões](https://github.com/seu-usuario/meta-campaign-manager/discussions)
- ⚠️ [Troubleshooting](./docs/setup/AMBIENTE.md#troubleshooting-comum)

---

## ⭐ Roadmap

- [x] Documentação completa
- [x] Sistema de agentes de IA
- [x] Integração Meta API
- [x] Dashboard e métricas
- [ ] Frontend completo (em andamento)
- [ ] Testes automatizados
- [ ] Deploy e CI/CD
- [ ] Agendamento de campanhas
- [ ] Testes A/B

---

## 📄 Licença

Este projeto é fornecido como **material educacional**.

Sinta-se livre para usar, modificar e aprender com ele!

---

## 🙏 Agradecimentos

Obrigado por usar este guia!

Se você aprendeu algo novo, considere:
- ⭐ Dar uma estrela no GitHub
- 📢 Compartilhar com amigos
- 🤝 Contribuir com melhorias

---

**Desenvolvido com ❤️ como material educacional para desenvolvedores**

**[👉 COMECE AGORA: Clique aqui para o Guia Completo](./docs/GUIA_COMPLETO.md)**
