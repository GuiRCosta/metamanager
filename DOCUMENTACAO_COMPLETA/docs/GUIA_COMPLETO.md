# Guia Completo: Construindo um Sistema de Gerenciamento de Campanhas Meta

> **Documentação completa para criar uma aplicação full-stack de gerenciamento de campanhas Meta Ads com Next.js, FastAPI e Supabase**

## 📋 Índice

1. [Configuração do Ambiente](./setup/AMBIENTE.md) ✅
2. [Banco de Dados e Schema](./database/README.md) ✅
3. [Backend com FastAPI](./backend/README.md) ✅
   - Estrutura do projeto
   - Configuração FastAPI
   - **Sistema de Agentes de IA** 🤖
     - Campaign Optimizer Agent
     - Budget Advisor Agent
     - Performance Analyst Agent
     - Agent Orchestrator
4. [Arquitetura de Skills](./skills/ARQUITETURA_SKILLS.md) ✅ ⭐
   - **8 Skills Especializadas:**
     - Ad Campaign Orchestrator (Orquestração)
     - Campaign Creator (Criação)
     - Campaign Editor (Edição)
     - Audience Manager (Audiências)
     - Creative Manager (Criativos)
     - Budget Optimizer (Otimização)
     - Performance Analyzer (Análise)
     - Report Generator (Relatórios)
   - Workflows integrados
   - Como usar skills vs agentes
5. [Integração com Meta API](./integracao/META_API.md) ✅
   - Autenticação
   - CRUD de campanhas
   - Insights e métricas
   - Rate limiting
6. [Frontend com Next.js](./frontend/README.md) 🚧
7. [Autenticação e Segurança](./seguranca/AUTENTICACAO.md) 🚧
8. [Deploy e Produção](./deploy/PRODUCAO.md) 🚧

---

## 🎯 O Que Você Vai Aprender

Este guia ensina como construir um **sistema completo de gerenciamento de campanhas publicitárias** para Meta (Facebook/Instagram) com:

- ✅ **Interface moderna e responsiva** com Next.js 15 e Tailwind CSS
- ✅ **API robusta** com FastAPI e validação de dados
- ✅ **Integração completa** com Meta Marketing API
- ✅ **Autenticação segura** com NextAuth.js
- ✅ **Banco de dados PostgreSQL** com Prisma ORM
- ✅ **Dashboard em tempo real** com métricas e analytics
- ✅ **Sistema de alertas** e notificações
- ✅ **Rate limiting** e proteção contra abuso
- ✅ **Sincronização bidirecional** com Meta API

---

## 🏗️ Arquitetura da Aplicação

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 15 + React + Tailwind CSS + shadcn/ui             │
│                                                              │
│  • Dashboard com métricas em tempo real                     │
│  • Gerenciamento de campanhas                               │
│  • Analytics e relatórios                                   │
│  • Sistema de alertas                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ API REST (fetch)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│  Python 3.11+ + FastAPI + Pydantic                          │
│                                                              │
│  • Proxy para Meta Marketing API                            │
│  • Rate limiting e caching                                  │
│  • Validação de dados                                       │
│  • Processamento de webhooks                                │
└──────────────────┬─────────────┬────────────────────────────┘
                   │             │
                   │             │ Meta Marketing API v24.0
                   │             │
                   │             ▼
                   │     ┌───────────────┐
                   │     │  Meta Graph   │
                   │     │     API       │
                   │     └───────────────┘
                   │
                   │ Prisma ORM
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                 DATABASE (PostgreSQL)                        │
│  Supabase PostgreSQL 15                                     │
│                                                              │
│  • Campanhas e Ad Sets                                      │
│  • Métricas e insights                                      │
│  • Usuários e settings                                      │
│  • Alertas e notificações                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Stack Tecnológica

### Frontend
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes UI acessíveis
- **Recharts** - Gráficos e visualizações
- **NextAuth.js** - Autenticação
- **Zod** - Validação de schemas

### Backend
- **FastAPI** - Framework web assíncrono Python
- **Pydantic** - Validação de dados
- **httpx** - Cliente HTTP assíncrono
- **python-dotenv** - Variáveis de ambiente

### Database
- **PostgreSQL 15** - Banco de dados relacional
- **Prisma** - ORM type-safe
- **Supabase** - Backend-as-a-Service

### APIs e Integrações
- **Meta Marketing API v24.0** - Gerenciamento de campanhas
- **Meta Graph API** - Dados sociais
- **Evolution API** (opcional) - WhatsApp

---

## 📊 Funcionalidades Principais

### 1. Dashboard
- Visão geral de todas as campanhas
- Métricas em tempo real (gastos, impressões, cliques, conversões)
- Gráficos de performance
- Alertas e notificações
- Orçamento mensal com projeções

### 2. Gerenciamento de Campanhas
- Criar, editar e arquivar campanhas
- Sincronização bidirecional com Meta
- Ações em lote (ativar/pausar múltiplas)
- Duplicação de campanhas
- Filtros e busca avançada

### 3. 🤖 Sistema de Agentes de IA (DIFERENCIAL!)

**Múltiplos agentes especializados trabalhando em conjunto:**

#### **Campaign Optimizer Agent**
- Analisa performance em tempo real
- Sugere ajustes de orçamento baseados em ROAS
- Identifica anúncios de baixa performance
- Recomenda otimizações de targeting
- **Function Calling**: Acessa métricas automaticamente

#### **Budget Advisor Agent**
- Projeta gastos mensais
- Analisa distribuição de budget
- Sugere realocação entre campanhas
- Alerta sobre overspending
- Calcula eficiência (ROAS ponderado)

#### **Performance Analyst Agent**
- Identifica tendências de performance
- Compara campanhas
- Detecta anomalias
- Explica correlações entre métricas
- Gera insights acionáveis

#### **Agent Orchestrator**
- Detecta intenção do usuário
- Roteia para agente especializado
- Combina respostas de múltiplos agentes
- Mantém contexto da conversa

**Exemplo de uso:**
```
Usuário: "Como posso melhorar o ROAS das minhas campanhas?"

Campaign Optimizer: "Analisando suas 5 campanhas ativas...
Campanha 'Black Friday' tem ROAS de 4.2x - excelente! Recomendo
aumentar budget em 20%. Já a campanha 'Verão' está com ROAS de
1.1x - abaixo da meta. Sugiro pausar ou revisar criativos."
```

### 4. Analytics
- Métricas detalhadas por campanha
- Comparação de períodos
- Exportação de relatórios
- KPIs customizáveis (CTR, CPC, ROAS)

### 5. Sistema de Alertas
- Alertas de orçamento (50%, 80%, 100%)
- Alertas de performance
- Notificações de mudança de status
- Sugestões automáticas de otimização

### 6. Configurações
- Integração com Meta API
- Limites de orçamento
- Metas de conversão
- Preferências de notificação
- Integração WhatsApp (opcional)

---

## 📁 Estrutura do Projeto

```
meta-campaign-manager/
├── frontend/                    # Next.js Application
│   ├── src/
│   │   ├── app/                # App Router
│   │   │   ├── (dashboard)/   # Rotas protegidas
│   │   │   ├── api/           # API Routes
│   │   │   ├── login/         # Autenticação
│   │   │   └── layout.tsx
│   │   ├── components/        # Componentes React
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   └── layout/       # Layout components
│   │   ├── lib/              # Utilidades
│   │   │   ├── auth.ts       # NextAuth config
│   │   │   ├── db.ts         # Prisma client
│   │   │   ├── validation.ts # Zod schemas
│   │   │   └── rate-limit.ts
│   │   └── types/            # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── public/               # Assets estáticos
│   └── package.json
│
├── backend/                    # FastAPI Application
│   ├── app/
│   │   ├── api/              # Rotas da API
│   │   │   ├── campaigns.py  # Endpoints de campanhas
│   │   │   ├── chat.py       # IA Agent
│   │   │   └── sync.py       # Sincronização
│   │   ├── tools/            # Ferramentas
│   │   │   └── meta_api.py   # Meta API client
│   │   ├── config.py         # Configurações
│   │   └── main.py           # Entry point
│   ├── requirements.txt
│   └── env.config.sh
│
├── docs/                       # Documentação
│   ├── arquitetura/
│   ├── setup/
│   ├── backend/
│   ├── frontend/
│   ├── database/
│   ├── integracao/
│   ├── seguranca/
│   └── deploy/
│
└── README.md
```

---

## 🎓 Pré-requisitos

Antes de começar, você precisa ter conhecimento básico em:

- **JavaScript/TypeScript** - Sintaxe ES6+, async/await, Promises
- **React** - Componentes, hooks, estado
- **Python** - Sintaxe básica, async/await
- **SQL** - Queries básicas, relacionamentos
- **Git** - Controle de versão
- **Terminal/CLI** - Comandos básicos

### Ferramentas Necessárias

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://python.org/)
- **PostgreSQL 15+** ou conta Supabase - [Supabase](https://supabase.com/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recomendado) - [Download](https://code.visualstudio.com/)

### Contas Necessárias

- **Meta Developer** - [Meta for Developers](https://developers.facebook.com/)
- **Supabase** (ou PostgreSQL local) - [Supabase](https://supabase.com/)
- **GitHub** (para deploy) - [GitHub](https://github.com/)

---

## 🚦 Por Onde Começar?

### Iniciantes
Se você é iniciante, siga esta ordem:

1. [Configuração do Ambiente](./setup/AMBIENTE.md) - Instale todas as ferramentas
2. [Visão Geral da Arquitetura](./arquitetura/VISAO_GERAL.md) - Entenda como tudo funciona
3. [Banco de Dados e Schema](./database/README.md) - Configure o banco
4. [Backend com FastAPI](./backend/README.md) - Construa a API
5. [Frontend com Next.js](./frontend/README.md) - Construa a interface

### Desenvolvedores Experientes
Se você já tem experiência:

1. Clone a estrutura do projeto
2. Configure variáveis de ambiente
3. Execute `npm install` e `pip install -r requirements.txt`
4. Configure o Prisma e rode as migrations
5. Inicie frontend e backend

---

## 💡 Conceitos-Chave

### 1. App Router do Next.js 15
O Next.js 15 usa o novo App Router com Server Components por padrão:
- Componentes Server (SSR) vs Client (`'use client'`)
- API Routes nativas
- Layouts aninhados
- Loading e Error states

### 2. Meta Marketing API
A Meta Marketing API permite gerenciar campanhas programaticamente:
- Hierarquia: Campaign → Ad Set → Ad
- Insights e métricas em tempo real
- Rate limiting rigoroso (200 req/hora)
- Sandbox vs Produção

### 3. Prisma ORM
ORM type-safe que gera tipos TypeScript automaticamente:
- Schema declarativo
- Migrations automáticas
- Type safety completo
- Queries otimizadas

### 4. Rate Limiting
Proteção contra abuso de API:
- Sliding window algorithm
- Diferentes limites por endpoint
- Headers de rate limit
- Retry-After

---

## 📈 Roadmap de Aprendizado

### Semana 1: Fundamentos
- [ ] Configure o ambiente de desenvolvimento
- [ ] Entenda a arquitetura completa
- [ ] Configure banco de dados e Prisma
- [ ] Crie o schema básico

### Semana 2: Backend
- [ ] Configure FastAPI e estrutura do projeto
- [ ] Implemente endpoints de campanhas
- [ ] Integre com Meta Marketing API
- [ ] Adicione validação e tratamento de erros

### Semana 3: Frontend Básico
- [ ] Configure Next.js e estrutura
- [ ] Crie sistema de autenticação
- [ ] Implemente dashboard básico
- [ ] Adicione listagem de campanhas

### Semana 4: Features Avançadas
- [ ] Implemente gráficos e analytics
- [ ] Adicione sistema de alertas
- [ ] Implemente sincronização
- [ ] Adicione ações em lote

### Semana 5: Polish e Deploy
- [ ] Melhore UI/UX
- [ ] Adicione testes
- [ ] Configure CI/CD
- [ ] Deploy para produção

---

## 🤝 Contribuindo

Este guia está em constante evolução. Se encontrar erros ou tiver sugestões:

1. Abra uma issue
2. Envie um pull request
3. Entre em contato

---

## 📚 Recursos Adicionais

### Documentações Oficiais
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tutoriais Recomendados
- [Next.js App Router](https://nextjs.org/docs/app)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)

---

## 📝 Licença

Este guia é fornecido como material educacional.

---

## 🎉 Próximos Passos

Pronto para começar? Vá para [Configuração do Ambiente](./setup/AMBIENTE.md) e configure seu ambiente de desenvolvimento!

**Boa sorte e bom código! 🚀**
