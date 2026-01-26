# Banco de Dados e Schema com Prisma

Este guia explica como configurar o banco de dados PostgreSQL usando Prisma ORM, criar o schema completo e entender a estrutura de dados da aplicação.

---

## 📋 Índice

1. [Introdução ao Prisma](#introdução-ao-prisma)
2. [Configuração Inicial](#configuração-inicial)
3. [Schema Completo](#schema-completo)
4. [Relacionamentos](#relacionamentos)
5. [Migrations](#migrations)
6. [Queries Comuns](#queries-comuns)
7. [Troubleshooting](#troubleshooting)

---

## Introdução ao Prisma

Prisma é um ORM (Object-Relational Mapping) moderno que:

- ✅ Gera tipos TypeScript automaticamente
- ✅ Oferece type-safety em todas as queries
- ✅ Gerencia migrations do banco de dados
- ✅ Possui IntelliSense/autocomplete
- ✅ Previne SQL injection automaticamente

### Por que Prisma?

```typescript
// ❌ SQL tradicional (sem type safety)
const result = await db.query('SELECT * FROM campaigns WHERE userId = ?', [userId]);

// ✅ Prisma (type-safe, autocomplete)
const campaigns = await prisma.campaign.findMany({
  where: { userId },
  include: { metrics: true }
});
// TypeScript sabe exatamente o tipo de 'campaigns'!
```

---

## Configuração Inicial

### 1. Instalar Prisma

```bash
cd frontend

# Instalar Prisma CLI (dev dependency)
npm install -D prisma

# Instalar Prisma Client (production dependency)
npm install @prisma/client
```

### 2. Inicializar Prisma

```bash
# Criar estrutura Prisma
npx prisma init

# Isso cria:
# - prisma/schema.prisma (schema do banco)
# - .env (variáveis de ambiente)
```

### 3. Configurar .env

Edite `frontend/.env` e adicione:

```env
# Supabase Pooler (para queries)
DATABASE_URL="postgresql://postgres.xxx:senha@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct (para migrations)
DIRECT_URL="postgresql://postgres.xxx:senha@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

**IMPORTANTE**:
- `DATABASE_URL` usa porta **6543** (pooler) para queries
- `DIRECT_URL` usa porta **5432** (direct) para migrations
- Codifique caracteres especiais na senha (`@` → `%40`)

### 4. Configurar schema.prisma

Edite `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Para migrations
}
```

---

## Schema Completo

### Estrutura de Tabelas

```
Users
  ↓ (1:N)
Campaigns
  ↓ (1:N)
CampaignMetrics

Campaigns
  ↓ (1:N)
AdSets
  ↓ (1:N)
Ads

Users
  ↓ (1:1)
Settings

Users
  ↓ (1:N)
Alerts
```

### Schema Prisma Completo

Cole isso em `prisma/schema.prisma`:

```prisma
// ============================================
// GENERATOR E DATASOURCE
// ============================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================
// MODELS
// ============================================

// User - Usuários do sistema
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  name      String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Relacionamentos
  campaigns Campaign[]
  settings  Settings?
  alerts    Alert[]

  @@map("users")
}

// Campaign - Campanhas publicitárias
model Campaign {
  id             String         @id @default(uuid())
  userId         String
  metaId         String         @unique  // ID da campanha no Meta
  name           String
  objective      String         // Ex: OUTCOME_TRAFFIC, OUTCOME_LEADS
  status         CampaignStatus @default(PAUSED)
  dailyBudget    Float?         // Em reais (R$)
  lifetimeBudget Float?         // Em reais (R$)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  // Relacionamentos
  user    User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  metrics CampaignMetric[]
  adSets  AdSet[]
  alerts  Alert[]

  @@index([userId])
  @@index([status])
  @@index([metaId])
  @@map("campaigns")
}

// CampaignMetric - Métricas diárias das campanhas
model CampaignMetric {
  id          String   @id @default(uuid())
  campaignId  String
  date        DateTime
  spend       Float    @default(0)  // Gasto em R$
  impressions Int      @default(0)
  clicks      Int      @default(0)
  conversions Int      @default(0)
  createdAt   DateTime @default(now())

  // Relacionamentos
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, date])  // Uma métrica por campanha por dia
  @@index([campaignId])
  @@index([date])
  @@map("campaign_metrics")
}

// AdSet - Conjuntos de anúncios
model AdSet {
  id           String         @id @default(uuid())
  campaignId   String
  metaId       String         @unique
  name         String
  status       CampaignStatus @default(PAUSED)
  dailyBudget  Float?
  targeting    Json?          // Dados de segmentação
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  // Relacionamentos
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  ads      Ad[]

  @@index([campaignId])
  @@map("ad_sets")
}

// Ad - Anúncios individuais
model Ad {
  id        String         @id @default(uuid())
  adSetId   String
  metaId    String         @unique
  name      String
  status    CampaignStatus @default(PAUSED)
  creative  Json?          // Dados do criativo
  mediaUrl  String?        // URL da imagem/vídeo
  mediaType String?        // IMAGE, VIDEO, CAROUSEL
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  // Relacionamentos
  adSet AdSet @relation(fields: [adSetId], references: [id], onDelete: Cascade)

  @@index([adSetId])
  @@map("ads")
}

// Settings - Configurações do usuário
model Settings {
  id                     String   @id @default(uuid())
  userId                 String   @unique

  // Budget & Alerts
  monthlyBudgetLimit     Float    @default(5000)
  alertAt50Percent       Boolean  @default(true)
  alertAt80Percent       Boolean  @default(true)
  alertAt100Percent      Boolean  @default(true)
  alertOnProjectedOverrun Boolean @default(true)

  // Goals & Limits
  conversionGoal         Int?
  roasGoal               Float?
  cpcMaxLimit            Float?
  ctrMinLimit            Float?

  // WhatsApp Integration
  whatsappEnabled        Boolean  @default(false)
  whatsappNumber         String?

  // Notifications
  dailyReportTime        String   @default("09:00")
  sendDailyReports       Boolean  @default(true)
  sendImmediateAlerts    Boolean  @default(true)
  sendSuggestions        Boolean  @default(true)
  sendStatusChanges      Boolean  @default(true)

  // Meta API (Sensitive)
  metaAccessToken        String?
  metaAdAccountId        String?
  metaPageId             String?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  // Relacionamentos
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("settings")
}

// Alert - Alertas e notificações
model Alert {
  id           String    @id @default(uuid())
  userId       String
  type         AlertType
  priority     String    // high, medium, low
  title        String
  message      String
  campaignId   String?
  campaignName String?
  read         Boolean   @default(false)
  createdAt    DateTime  @default(now())

  // Relacionamentos
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaign Campaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([read])
  @@index([createdAt])
  @@map("alerts")
}

// ============================================
// ENUMS
// ============================================

enum CampaignStatus {
  ACTIVE
  PAUSED
  ARCHIVED
  DRAFT
  PREPAUSED
}

enum AlertType {
  error
  warning
  info
  success
}
```

---

## Relacionamentos Explicados

### 1:N (Um para Muitos)

```prisma
// Um User tem muitas Campaigns
model User {
  campaigns Campaign[]
}

model Campaign {
  userId String
  user   User @relation(fields: [userId], references: [id])
}
```

### 1:1 (Um para Um)

```prisma
// Um User tem exatamente um Settings
model User {
  settings Settings?
}

model Settings {
  userId String @unique
  user   User @relation(fields: [userId], references: [id])
}
```

### Cascade Delete

```prisma
// Quando deletar User, deletar todas as Campaigns dele
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

---

## Migrations

### 1. Criar Migration Inicial

```bash
cd frontend

# Criar migration e aplicar ao banco
npx prisma migrate dev --name init

# Isso faz:
# 1. Cria SQL em prisma/migrations/
# 2. Aplica no banco de dados
# 3. Gera Prisma Client
```

### 2. Ver Estado das Migrations

```bash
# Ver status
npx prisma migrate status

# Ver SQL que será executado
npx prisma migrate diff
```

### 3. Aplicar Migrations em Produção

```bash
# NÃO usar migrate dev em produção!
# Usar migrate deploy:
npx prisma migrate deploy
```

### 4. Resetar Banco (CUIDADO!)

```bash
# Apaga TODOS os dados e recria
npx prisma migrate reset

# Com confirmação
npx prisma migrate reset --skip-seed
```

---

## Gerar Prisma Client

Sempre que alterar o schema:

```bash
# Gerar cliente TypeScript
npx prisma generate

# Isso atualiza:
# node_modules/@prisma/client
# Com tipos TypeScript atualizados
```

---

## Prisma Studio (GUI)

Explore o banco de dados visualmente:

```bash
# Abrir Prisma Studio
npx prisma studio

# Abre em: http://localhost:5555
```

Prisma Studio permite:
- Ver todas as tabelas
- Editar dados manualmente
- Criar registros
- Deletar registros
- Filtrar e buscar

---

## Queries Comuns

### Criar Cliente Prisma

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Buscar Campanhas

```typescript
// Buscar todas as campanhas do usuário
const campaigns = await prisma.campaign.findMany({
  where: { userId: user.id },
  include: {
    metrics: true,
    adSets: {
      include: {
        ads: true
      }
    }
  }
});

// Buscar uma campanha específica
const campaign = await prisma.campaign.findUnique({
  where: { id: campaignId }
});

// Buscar com filtros
const activeCampaigns = await prisma.campaign.findMany({
  where: {
    userId: user.id,
    status: 'ACTIVE',
    name: {
      contains: 'Black Friday',
      mode: 'insensitive'  // Case insensitive
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10,  // Limite
  skip: 0    // Offset
});
```

### Criar Campanha

```typescript
const campaign = await prisma.campaign.create({
  data: {
    userId: user.id,
    metaId: 'meta_123',
    name: 'Nova Campanha',
    objective: 'OUTCOME_TRAFFIC',
    status: 'PAUSED',
    dailyBudget: 100,
    adSets: {
      create: {
        metaId: 'adset_123',
        name: 'Ad Set 1',
        status: 'PAUSED',
        dailyBudget: 100
      }
    }
  },
  include: {
    adSets: true
  }
});
```

### Atualizar Campanha

```typescript
// Atualizar status
const updated = await prisma.campaign.update({
  where: { id: campaignId },
  data: { status: 'ACTIVE' }
});

// Upsert (update ou create)
const campaign = await prisma.campaign.upsert({
  where: { metaId: 'meta_123' },
  update: { name: 'Nome Atualizado' },
  create: {
    userId: user.id,
    metaId: 'meta_123',
    name: 'Nova Campanha',
    objective: 'OUTCOME_TRAFFIC'
  }
});
```

### Deletar Campanha

```typescript
// Deletar (cascade deleta metrics, adSets, ads)
await prisma.campaign.delete({
  where: { id: campaignId }
});

// Soft delete (arquivar)
await prisma.campaign.update({
  where: { id: campaignId },
  data: { status: 'ARCHIVED' }
});
```

### Métricas e Agregações

```typescript
// Somar gastos do mês
const totalSpend = await prisma.campaignMetric.aggregate({
  where: {
    campaign: { userId: user.id },
    date: {
      gte: new Date(2024, 0, 1)  // Janeiro 2024
    }
  },
  _sum: { spend: true }
});

// Contar campanhas por status
const counts = await prisma.campaign.groupBy({
  by: ['status'],
  where: { userId: user.id },
  _count: true
});
```

### Transações

```typescript
// Executar múltiplas operações atomicamente
const result = await prisma.$transaction(async (tx) => {
  // Criar campanha
  const campaign = await tx.campaign.create({
    data: { /* ... */ }
  });

  // Criar alerta
  await tx.alert.create({
    data: {
      userId: user.id,
      type: 'success',
      title: 'Campanha criada',
      message: `Campanha ${campaign.name} criada`
    }
  });

  return campaign;
});
```

---

## Seed do Banco (Dados Iniciais)

### Criar seed.ts

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@meta.com' },
    update: {},
    create: {
      email: 'admin@meta.com',
      password: hashedPassword,
      name: 'Admin',
      settings: {
        create: {
          monthlyBudgetLimit: 5000
        }
      }
    }
  });

  console.log('✅ Admin criado:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Configurar package.json

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### Executar Seed

```bash
# Instalar ts-node
npm install -D ts-node

# Executar seed
npx prisma db seed
```

---

## Troubleshooting

### Erro: "Can't reach database server"

**Solução**:
```bash
# 1. Verificar URLs no .env
echo $DATABASE_URL
echo $DIRECT_URL

# 2. Testar conexão
npx prisma db pull

# 3. Verificar senha URL-encoded
# @ → %40
# # → %23
```

### Erro: "Migration failed"

**Solução**:
```bash
# 1. Ver detalhes
npx prisma migrate status

# 2. Resetar migrations (CUIDADO!)
npx prisma migrate reset

# 3. Criar nova migration
npx prisma migrate dev --name fix
```

### Erro: "Type X is not assignable"

**Solução**:
```bash
# Regenerar client
npx prisma generate

# Reiniciar TypeScript server no VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Prisma Client desatualizado

```bash
# Sempre após alterar schema.prisma:
npx prisma generate
```

---

## Próximos Passos

Agora que o banco está configurado:

1. ✅ **[Backend com FastAPI](../backend/README.md)** - Construa a API
2. ✅ **[Frontend com Next.js](../frontend/README.md)** - Construa a interface
3. ✅ **[Integração com Meta API](../integracao/META_API.md)** - Conecte com Meta

---

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
