# UX/UI Design - Sistema de Gerenciamento de Campanhas

Guia completo de design de interface e experiência do usuário para o sistema de gerenciamento de campanhas Meta.

---

## 📋 Índice

1. [Princípios de Design](#princípios-de-design)
2. [Arquitetura da Interface](#arquitetura-da-interface)
3. [Componentes UI](#componentes-ui)
4. [Padrões de Interação](#padrões-de-interação)
5. [Design System](#design-system)
6. [Responsividade](#responsividade)
7. [Acessibilidade](#acessibilidade)

---

## Princípios de Design

### 1. Clareza sobre Complexidade

**Problema**: Gerenciar campanhas publicitárias é complexo (muitos dados, métricas, ações).

**Solução**:
- Interface limpa com informações priorizadas
- Progressive disclosure (mostrar detalhes sob demanda)
- Cards e seções bem definidas
- Hierarquia visual clara

### 2. Ação Rápida

**Problema**: Usuários precisam agir rápido (pausar campanhas, ajustar budget).

**Solução**:
- Ações principais sempre visíveis
- Atalhos de teclado
- Confirmações apenas para ações destrutivas
- Estado de loading claro

### 3. Confiança através de Dados

**Problema**: Decisões baseadas em métricas e tendências.

**Solução**:
- Gráficos claros e informativos
- Indicadores visuais de tendências (↑ ↓)
- Cores semânticas (verde = bom, vermelho = problema)
- Comparações contextuais

---

## Arquitetura da Interface

### Layout Principal

```
┌─────────────────────────────────────────────────────┐
│  Header (Logo, Sync, User)                          │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│          │  Main Content Area                        │
│ Sidebar  │  ┌─────────────────────────────────┐    │
│          │  │                                   │    │
│ • Dash   │  │  Page Content                    │    │
│ • Camps  │  │  (Dashboard, Campaigns, etc.)    │    │
│ • Agent  │  │                                   │    │
│ • Analyt │  │                                   │    │
│ • Alerts │  └─────────────────────────────────┘    │
│          │                                           │
│ Budget   │                                           │
│ Widget   │                                           │
│          │                                           │
└──────────┴──────────────────────────────────────────┘
```

### Hierarquia de Navegação

```
Nível 1: Sidebar
  ├─ Dashboard (Overview geral)
  ├─ Campanhas (Lista e gerenciamento)
  ├─ Agente IA (Chat e insights)
  ├─ Analytics (Métricas detalhadas)
  ├─ Alertas (Notificações)
  └─ Configurações

Nível 2: Breadcrumbs
  Dashboard > Campanhas > Campanha X > Editar

Nível 3: Tabs/Sections
  Campanha X:
    ├─ Visão Geral
    ├─ Ad Sets
    ├─ Anúncios
    └─ Métricas
```

---

## Componentes UI

### 1. Dashboard Cards

#### Metric Card (Cartão de Métrica)

```tsx
// Componente visual
<MetricCard
  title="Gasto Total"
  value="R$ 2.350,00"
  icon={DollarSign}
  trend="up"
  trendValue="+12%"
  suffix="/mês"
/>
```

**Design**:
```
┌────────────────────────────┐
│ 💰                    ↑ +12%│
│                             │
│ R$ 2.350,00 /mês           │
│ Gasto Total                 │
└────────────────────────────┘
```

**Cores**:
- Verde: Tendência positiva (quando aplicável)
- Vermelho: Tendência negativa ou alerta
- Azul: Informação neutra

#### Budget Progress Card

```tsx
<BudgetCard
  spent={2350}
  limit={5000}
  projected={4200}
/>
```

**Design**:
```
┌────────────────────────────┐
│ 💰 Orçamento Mensal   47% │
│                             │
│ R$ 2.350 / R$ 5.000        │
│                             │
│ ████████░░░░░░░░░░         │
│                             │
│ ✓ Projeção: R$ 4.200       │
└────────────────────────────┘
```

### 2. Campaign Table (Tabela de Campanhas)

**Features essenciais**:
- ✅ Checkbox para seleção múltipla
- ✅ Status visual (badge colorido)
- ✅ Métricas inline
- ✅ Ações rápidas (Play/Pause/Edit/Delete)
- ✅ Ordenação por coluna
- ✅ Filtros e busca

**Design**:
```
┌─┬──────────────┬────────┬───────┬────────┬─────────┬───────┐
│☐│ Nome         │ Status │ Gasto │ Clicks │   CTR   │ Ações │
├─┼──────────────┼────────┼───────┼────────┼─────────┼───────┤
│☑│ Black Friday │ 🟢 ATIVO│ R$150 │  520   │ 2.5% ↑ │ ⋮ ⏸ │
│☐│ Verão 2024   │ 🟡 PAUSA│ R$ 80 │  180   │ 1.2% ↓ │ ⋮ ▶ │
│☐│ Remarketing  │ 🟢 ATIVO│ R$200 │  890   │ 4.1% ↑ │ ⋮ ⏸ │
└─┴──────────────┴────────┴───────┴────────┴─────────┴───────┘
```

**Estados visuais**:
- 🟢 ATIVO (verde)
- 🟡 PAUSADO (amarelo)
- 🔴 ERRO (vermelho)
- ⚪ RASCUNHO (cinza)

### 3. Charts (Gráficos)

#### Line Chart (Gasto ao longo do tempo)

```tsx
<SpendingChart
  data={last7Days}
  height={200}
/>
```

**Design**:
```
R$
│                              ●
│                          ●
│                      ●
│                  ●
│              ●
│          ●
│      ●
└─────────────────────────────────
  Seg  Ter  Qua  Qui  Sex  Sab  Dom
```

**Cores**:
- Linha: Azul primário (#3B82F6)
- Pontos: Azul escuro
- Grid: Cinza claro
- Tooltip: Fundo branco com sombra

#### Bar Chart (Comparação de campanhas)

```
│
│  ████
│  ████  ██
│  ████  ██  ████
└──────────────────
   A     B    C
```

### 4. Dialogs e Modals

#### Confirm Dialog (Confirmação de ação destrutiva)

```tsx
<ConfirmDialog
  title="Arquivar Campanha?"
  message="Esta ação não pode ser desfeita. A campanha será pausada e arquivada."
  confirmText="Arquivar"
  cancelText="Cancelar"
  variant="destructive"
/>
```

**Design**:
```
┌────────────────────────────────────┐
│ ⚠️  Arquivar Campanha?            │
│                                    │
│ Esta ação não pode ser desfeita.   │
│ A campanha será pausada e          │
│ arquivada.                          │
│                                    │
│  [Cancelar]  [Arquivar]           │
└────────────────────────────────────┘
```

### 5. Toast Notifications

```tsx
// Sucesso
toast.success("Campanha criada com sucesso!")

// Erro
toast.error("Falha ao sincronizar com Meta API")

// Info
toast.info("Sincronização em andamento...")

// Warning
toast.warning("Orçamento atingiu 80%")
```

**Posicionamento**: Canto superior direito
**Duração**: 3-5 segundos
**Ações**: Dismiss (X) + Ação opcional

### 6. Loading States

#### Skeleton Loading

```tsx
<Skeleton className="h-32 w-full" />
```

**Para**:
- Cards iniciais
- Tabelas
- Gráficos

#### Spinner Loading

```tsx
<Spinner size="lg" />
```

**Para**:
- Botões (após clique)
- Ações inline
- Buscas

---

## Padrões de Interação

### 1. Seleção Múltipla

**Padrão**:
- Checkbox na primeira coluna
- Select all no header
- Barra de ações aparece quando > 0 selecionados

**Ações em lote**:
```
[✓ 3 selecionadas]  [▶ Ativar]  [⏸ Pausar]  [🗑 Arquivar]
```

### 2. Filtros

**Pattern**:
- Filtros sempre visíveis acima da tabela
- Aplicação automática (sem botão "Aplicar")
- Indicador de filtros ativos
- Limpar todos os filtros

```tsx
<Filters>
  <Select placeholder="Status">
    <Option value="all">Todos</Option>
    <Option value="ACTIVE">Ativo</Option>
    <Option value="PAUSED">Pausado</Option>
  </Select>

  <Input placeholder="Buscar campanha..." />

  <Button variant="ghost">Limpar filtros</Button>
</Filters>
```

### 3. Inline Editing

**Campos editáveis inline**:
- Nome da campanha
- Orçamento diário
- Status (toggle)

**Interação**:
1. Clique no campo
2. Campo vira input
3. ESC cancela, ENTER salva
4. Loader durante save
5. Toast de confirmação

### 4. Drag and Drop

**Para**:
- Reordenar campanhas
- Upload de imagens
- Organizar Ad Sets

```tsx
<DragDropZone
  onDrop={handleImageUpload}
  accept="image/*"
  maxSize={5MB}
>
  Arraste imagem aqui ou clique para selecionar
</DragDropZone>
```

---

## Design System

### Cores

#### Primárias
```css
--primary: #3B82F6      /* Azul - Ações principais */
--success: #10B981      /* Verde - Sucesso, positivo */
--warning: #F59E0B      /* Amarelo - Atenção */
--destructive: #EF4444  /* Vermelho - Erro, negativo */
--muted: #6B7280        /* Cinza - Secundário */
```

#### Semântica de Status
```css
--status-active: #10B981   /* Verde - Ativo */
--status-paused: #F59E0B   /* Amarelo - Pausado */
--status-archived: #6B7280 /* Cinza - Arquivado */
--status-draft: #94A3B8    /* Cinza claro - Rascunho */
--status-error: #EF4444    /* Vermelho - Erro */
```

### Tipografia

```css
/* Headings */
h1: 2rem (32px) - font-bold - Títulos de página
h2: 1.5rem (24px) - font-semibold - Seções
h3: 1.25rem (20px) - font-medium - Subsection
h4: 1rem (16px) - font-medium - Cards

/* Body */
body: 0.875rem (14px) - font-normal - Texto padrão
small: 0.75rem (12px) - font-normal - Labels
```

### Espaçamento

```css
/* Baseado em múltiplos de 4px */
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px
--spacing-6: 24px
--spacing-8: 32px
--spacing-12: 48px
```

### Componentes shadcn/ui Utilizados

```bash
# Essenciais
Button, Card, Input, Label, Select, Table
Badge, Progress, Skeleton

# Overlays
Dialog, Sheet, Dropdown, Toast

# Feedback
Alert, Spinner, Tooltip

# Forms
Form, Checkbox, Radio, Switch, Textarea

# Data Display
Table, Tabs, Accordion
```

---

## Responsividade

### Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop pequeno */
xl: 1280px  /* Desktop médio */
2xl: 1536px /* Desktop grande */
```

### Layout Adaptativo

#### Desktop (≥ 1024px)
- Sidebar fixa à esquerda
- Dashboard: Grid 3 colunas
- Tabelas: Todas as colunas visíveis

#### Tablet (768px - 1023px)
- Sidebar colapsável
- Dashboard: Grid 2 colunas
- Tabelas: Colunas essenciais + dropdown

#### Mobile (< 768px)
- Sidebar vira bottom sheet
- Dashboard: 1 coluna
- Tabelas: Cards verticais

**Exemplo de adaptação**:
```tsx
{/* Desktop: Table */}
<div className="hidden lg:block">
  <CampaignTable />
</div>

{/* Mobile: Cards */}
<div className="lg:hidden">
  <CampaignCards />
</div>
```

---

## Acessibilidade

### Princípios WCAG 2.1

#### 1. Perceptível

**Contraste de cores**:
- Texto normal: Mínimo 4.5:1
- Texto grande: Mínimo 3:1
- Componentes UI: Mínimo 3:1

**Alt text para imagens**:
```tsx
<img
  src="/campaign-image.jpg"
  alt="Anúncio da campanha Black Friday mostrando desconto de 50%"
/>
```

#### 2. Operável

**Navegação por teclado**:
```tsx
// Tab index apropriado
<Button tabIndex={0}>Criar Campanha</Button>

// Atalhos
onKeyPress={(e) => {
  if (e.key === 'Enter') handleSubmit()
  if (e.key === 'Escape') handleCancel()
}}
```

**Atalhos de teclado**:
- `Ctrl/Cmd + K`: Busca global
- `Ctrl/Cmd + N`: Nova campanha
- `Ctrl/Cmd + S`: Salvar
- `Escape`: Fechar modals

#### 3. Compreensível

**Labels claros**:
```tsx
<Label htmlFor="campaign-name">
  Nome da Campanha
  <span className="text-destructive">*</span>
</Label>
<Input id="campaign-name" required />
```

**Mensagens de erro descritivas**:
```tsx
{errors.budget && (
  <p className="text-sm text-destructive">
    Orçamento deve ser no mínimo R$ 50,00
  </p>
)}
```

#### 4. Robusto

**ARIA labels**:
```tsx
<button
  aria-label="Pausar campanha Black Friday"
  onClick={handlePause}
>
  <PauseIcon />
</button>

<div role="status" aria-live="polite">
  Sincronizando campanhas... 50%
</div>
```

**Screen reader support**:
```tsx
<span className="sr-only">
  Campanha ativa com gasto de R$ 150 e CTR de 2.5%
</span>
```

---

## Estados Vazios

### Empty States

**Quando não há dados**:
```tsx
<EmptyState
  icon={Megaphone}
  title="Nenhuma campanha encontrada"
  description="Crie sua primeira campanha ou sincronize com a Meta API"
  action={
    <Button onClick={handleSync}>
      Sincronizar Campanhas
    </Button>
  }
/>
```

**Design**:
```
┌─────────────────────────┐
│                         │
│         📢              │
│                         │
│  Nenhuma campanha       │
│  encontrada             │
│                         │
│  Crie sua primeira      │
│  campanha ou sincronize │
│                         │
│  [Sincronizar]         │
│                         │
└─────────────────────────┘
```

---

## Micro-interações

### Hover Effects
```css
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

### Click Feedback
```css
.button:active {
  transform: scale(0.98);
}
```

### Loading States
```tsx
<Button disabled={loading}>
  {loading && <Spinner className="mr-2" />}
  {loading ? 'Salvando...' : 'Salvar'}
</Button>
```

---

## Checklist de Qualidade UX/UI

### Antes de Deploy

- [ ] Todas as ações têm feedback visual
- [ ] Loading states em todas as operações assíncronas
- [ ] Confirmação para ações destrutivas
- [ ] Mensagens de erro claras e acionáveis
- [ ] Navegação por teclado funcional
- [ ] Contraste de cores WCAG AA
- [ ] Responsivo em mobile/tablet/desktop
- [ ] Empty states para todos os cenários
- [ ] Tooltips em ícones e ações
- [ ] Breadcrumbs em páginas profundas

---

## Recursos

### Ferramentas de Design
- **Figma**: Protótipos e design system
- **Tailwind CSS**: Estilização utilitária
- **shadcn/ui**: Componentes base
- **Lucide Icons**: Iconografia consistente

### Inspirações
- [Linear](https://linear.app) - Simplicidade e velocidade
- [Vercel Dashboard](https://vercel.com) - Data visualization
- [Stripe Dashboard](https://dashboard.stripe.com) - Clareza de métricas

---

**Próximo**: [Autenticação e Segurança](../seguranca/AUTENTICACAO.md)
