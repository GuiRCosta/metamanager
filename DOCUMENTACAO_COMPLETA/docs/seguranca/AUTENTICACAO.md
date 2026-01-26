# Autenticação e Segurança

Guia completo de segurança, autenticação e boas práticas para proteger a aplicação de gerenciamento de campanhas Meta.

---

## 📋 Índice

1. [Autenticação com NextAuth.js](#autenticação-com-nextauthjs)
2. [Autorização e Controle de Acesso](#autorização-e-controle-de-acesso)
3. [Rate Limiting](#rate-limiting)
4. [Validação de Dados](#validação-de-dados)
5. [Segurança de API](#segurança-de-api)
6. [Proteção contra Vulnerabilidades](#proteção-contra-vulnerabilidades)
7. [Secrets Management](#secrets-management)
8. [Auditoria e Logging](#auditoria-e-logging)

---

## Autenticação com NextAuth.js

### Configuração Básica

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas');
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error('Usuário não encontrado');
        }

        // Verificar senha
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error('Senha incorreta');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },

  pages: {
    signIn: '/login',
    error: '/login'
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  secret: process.env.NEXTAUTH_SECRET,
};
```

### Proteção de Rotas (Server Side)

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <div>{children}</div>;
}
```

### Proteção de Rotas (Client Side)

```typescript
// components/AuthGuard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

---

## Autorização e Controle de Acesso

### Roles e Permissões

```typescript
// prisma/schema.prisma
enum UserRole {
  ADMIN
  USER
  VIEWER
}

model User {
  id       String   @id @default(uuid())
  email    String   @unique
  password String
  role     UserRole @default(USER)
  // ...
}
```

### Middleware de Autorização

```typescript
// src/lib/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function withAuth(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  return { user: session.user };
}

export async function withRole(
  request: NextRequest,
  allowedRoles: UserRole[]
) {
  const result = await withAuth(request);

  if (result instanceof NextResponse) return result;

  const user = await prisma.user.findUnique({
    where: { id: result.user.id }
  });

  if (!user || !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Permissão negada' },
      { status: 403 }
    );
  }

  return { user };
}
```

### Uso em API Routes

```typescript
// app/api/campaigns/[id]/route.ts
import { withAuth } from '@/lib/api-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verificar autenticação
  const result = await withAuth(request);
  if (result instanceof NextResponse) return result;
  const { user } = result;

  // Verificar propriedade
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id }
  });

  if (!campaign) {
    return NextResponse.json(
      { error: 'Campanha não encontrada' },
      { status: 404 }
    );
  }

  if (campaign.userId !== user.id) {
    return NextResponse.json(
      { error: 'Você não tem permissão para deletar esta campanha' },
      { status: 403 }
    );
  }

  // Deletar
  await prisma.campaign.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ success: true });
}
```

---

## Rate Limiting

### Implementação com Upstash

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters para diferentes endpoints
export const rateLimiters = {
  // Sync: 10 requests por 5 minutos
  sync: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '5 m'),
    prefix: 'ratelimit:sync',
  }),

  // API geral: 20 requests por minuto
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'ratelimit:api',
  }),

  // Login: 5 tentativas por 15 minutos
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'ratelimit:login',
  }),
};
```

### Uso em API Routes

```typescript
// app/api/sync/route.ts
import { rateLimiters } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Rate limiting
  const identifier = session.user.id;
  const rateLimit = rateLimiters.sync.limit(identifier);

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Muitas requisições. Aguarde alguns minutos.',
        retry_after: rateLimit.reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
          'Retry-After': String(rateLimit.reset),
        },
      }
    );
  }

  // Processar requisição...
}
```

---

## Validação de Dados

### Validação com Zod

```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const createCampaignSchema = z.object({
  campaign: z.object({
    name: z.string()
      .min(1, 'Nome é obrigatório')
      .max(255, 'Nome muito longo'),
    objective: z.enum([
      'OUTCOME_TRAFFIC',
      'OUTCOME_LEADS',
      'OUTCOME_SALES',
    ]),
    dailyBudget: z.number()
      .positive('Orçamento deve ser positivo')
      .min(50, 'Orçamento mínimo: R$ 50')
      .optional(),
  }),
});

// Validar entrada
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    return { success: false, error: 'Erro de validação' };
  }
}
```

### Sanitização de Input

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Não permitir HTML
    ALLOWED_ATTR: [],
  });
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover < >
    .substring(0, 1000); // Limitar tamanho
}
```

---

## Segurança de API

### CORS Seguro

```typescript
// backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://seu-dominio.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600,
)
```

### Headers de Segurança

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};
```

---

## Proteção contra Vulnerabilidades

### SQL Injection (Prevenção)

```typescript
// ✅ CORRETO - Usando Prisma (prevenção automática)
const user = await prisma.user.findUnique({
  where: { email: userEmail }
});

// ❌ ERRADO - SQL raw sem parametrização
const user = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);

// ✅ CORRETO - SQL raw com parametrização
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userEmail}
`;
```

### XSS (Cross-Site Scripting)

```tsx
// ✅ CORRETO - React escapa automaticamente
<div>{userInput}</div>

// ❌ ERRADO - dangerouslySetInnerHTML sem sanitização
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ CORRETO - Com sanitização
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userInput)
}} />
```

### CSRF (Cross-Site Request Forgery)

```typescript
// NextAuth.js já protege com CSRF tokens
// Não precisa implementação adicional

// Para APIs customizadas:
import { getCsrfToken } from 'next-auth/react';

const csrfToken = await getCsrfToken();

fetch('/api/custom', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

---

## Secrets Management

### Variáveis de Ambiente

```bash
# .env.local (NUNCA commitar!)

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super-secret-key-aqui

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Meta API
META_ACCESS_TOKEN=EAABwzLixnjY...
META_AD_ACCOUNT_ID=act_123456789

# OpenAI
OPENAI_API_KEY=sk-proj-...
```

### Validação de Secrets

```typescript
// src/lib/config.ts
function validateEnv() {
  const required = [
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
    'META_ACCESS_TOKEN',
    'META_AD_ACCOUNT_ID',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

validateEnv();
```

### Rotação de Secrets

**Processo recomendado:**
1. Gerar novo secret
2. Adicionar aos servidores
3. Testar com novo secret
4. Remover secret antigo
5. Revogar access tokens antigos

---

## Auditoria e Logging

### Logger Estruturado

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Uso
logger.info('User logged in', { userId: user.id });
logger.error('API error', error);
logger.warn('Rate limit approaching', { userId, count });
```

### Audit Log

```typescript
// prisma/schema.prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String   // 'CREATE', 'UPDATE', 'DELETE'
  entity    String   // 'campaign', 'ad_set', etc
  entityId  String
  changes   Json?    // Mudanças realizadas
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}
```

```typescript
// src/lib/audit.ts
export async function logAudit(params: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
  request?: NextRequest;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      changes: params.changes,
      ipAddress: params.request?.headers.get('x-forwarded-for'),
      userAgent: params.request?.headers.get('user-agent'),
    },
  });
}

// Uso
await logAudit({
  userId: user.id,
  action: 'DELETE',
  entity: 'campaign',
  entityId: campaignId,
  request,
});
```

---

## Checklist de Segurança

### Antes de Deploy

**Autenticação**
- [ ] Senhas hasheadas com bcrypt (salt rounds ≥ 10)
- [ ] Session tokens seguros e HTTP-only
- [ ] HTTPS em produção
- [ ] Logout funcional

**Autorização**
- [ ] Verificação de permissões em todas as rotas
- [ ] Usuários só acessam seus próprios dados
- [ ] Roles e permissões implementados

**Validação**
- [ ] Todas as entradas validadas (Zod)
- [ ] Sanitização de HTML/XSS
- [ ] Limites de tamanho em uploads
- [ ] Validação server-side + client-side

**Rate Limiting**
- [ ] Rate limiting em login
- [ ] Rate limiting em APIs sensíveis
- [ ] Headers de rate limit retornados

**Secrets**
- [ ] Nenhum secret no código
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets rotacionados regularmente

**Headers de Segurança**
- [ ] HSTS habilitado
- [ ] X-Frame-Options configurado
- [ ] CSP (Content Security Policy) definido
- [ ] CORS configurado corretamente

**Logging**
- [ ] Audit logs implementados
- [ ] Erros logados (sem expor detalhes ao usuário)
- [ ] Monitoramento de atividades suspeitas

---

## Recursos

### Ferramentas
- [NextAuth.js](https://next-auth.js.org/) - Autenticação
- [Zod](https://zod.dev/) - Validação
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Hash de senhas
- [Upstash](https://upstash.com/) - Rate limiting

### Leituras Recomendadas
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Próximo**: [Deploy e Produção](../deploy/PRODUCAO.md)
