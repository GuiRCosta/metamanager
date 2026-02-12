"use client"

import { useState, useMemo } from "react"
import {
  Rocket,
  Megaphone,
  BarChart3,
  MessageSquare,
  Settings,
  HelpCircle,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface DocSection {
  id: string
  title: string
  content: string
  keywords: string[]
}

interface DocCategory {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  sections: DocSection[]
}

const docCategories: DocCategory[] = [
  {
    id: "quick-start",
    label: "Início Rápido",
    icon: <Rocket className="h-4 w-4" />,
    description: "Primeiros passos para começar a usar a plataforma",
    sections: [
      {
        id: "overview",
        title: "Visão Geral da Plataforma",
        keywords: ["visão geral", "plataforma", "sobre", "o que é"],
        content:
          "O Meta Campaign Manager é uma plataforma completa para gerenciamento de campanhas de anúncios no Meta (Facebook e Instagram). Com ele, você pode criar, monitorar e otimizar suas campanhas publicitárias em um só lugar, com dashboards intuitivos, alertas inteligentes e um agente de IA para auxiliar na análise dos dados.",
      },
      {
        id: "first-steps",
        title: "Primeiros Passos",
        keywords: ["primeiros passos", "começar", "início", "configurar"],
        content:
          "1. **Configurar a Meta API** — Acesse Configurações > Meta API e insira seu Access Token, Business ID e Ad Account ID. Você pode obter essas credenciais no Graph API Explorer do Meta.\n\n2. **Selecionar a conta de anúncios** — Use o seletor no topo da página para escolher a conta que deseja gerenciar. Você pode alternar entre contas a qualquer momento.\n\n3. **Explorar o Dashboard** — O Dashboard mostra um resumo das suas métricas, orçamento e alertas ativos. É o ponto de partida para monitorar suas campanhas.\n\n4. **Criar sua primeira campanha** — Vá em Campanhas > Nova Campanha e siga o assistente passo a passo.",
      },
      {
        id: "navigation",
        title: "Navegação na Plataforma",
        keywords: ["navegação", "menu", "sidebar", "tela"],
        content:
          "A plataforma possui um menu lateral (sidebar) com as seguintes seções:\n\n- **Dashboard** — Visão geral das métricas e orçamento\n- **Campanhas** — Listagem e gerenciamento de campanhas\n- **Agente IA** — Chat inteligente para análise de dados\n- **Analytics** — Métricas detalhadas e gráficos\n- **Alertas** — Notificações de problemas e oportunidades\n- **Configurações** — Integrações e preferências\n\nNo topo da página, você encontra o seletor de conta, botão de sincronização, alertas e configuração de tema (claro/escuro).",
      },
    ],
  },
  {
    id: "campaigns",
    label: "Campanhas",
    icon: <Megaphone className="h-4 w-4" />,
    description: "Criação e gerenciamento de campanhas publicitárias",
    sections: [
      {
        id: "create-campaign",
        title: "Como Criar uma Campanha",
        keywords: ["criar", "nova", "campanha", "wizard", "assistente"],
        content:
          "Para criar uma nova campanha:\n\n1. Acesse **Campanhas** no menu lateral\n2. Clique no botão **Nova Campanha**\n3. Siga o assistente de criação:\n   - **Objetivo** — Escolha entre Tráfego, Leads, Vendas, Engajamento, Reconhecimento ou Promoção de App\n   - **Nome** — Defina um nome descritivo para a campanha\n   - **Orçamento** — Configure o orçamento diário ou vitalício\n   - **Público** — Defina a segmentação de interesse e localização\n   - **Criativo** — Configure os anúncios\n4. Revise e publique a campanha",
      },
      {
        id: "manage-status",
        title: "Gerenciar Status das Campanhas",
        keywords: ["status", "ativar", "pausar", "arquivar", "ativa", "pausada"],
        content:
          "Cada campanha possui um status que indica seu estado atual:\n\n- **Ativa** — A campanha está rodando e entregando anúncios\n- **Pausada** — A campanha está temporariamente interrompida\n- **Arquivada** — A campanha foi encerrada e movida para o arquivo\n- **Rascunho** — A campanha foi criada mas ainda não publicada\n\nPara alterar o status, selecione as campanhas desejadas na tabela e use a barra de ações em massa que aparece ao selecionar 2 ou mais itens. Você pode ativar, pausar ou arquivar campanhas em lote.",
      },
      {
        id: "duplicate",
        title: "Duplicar Campanhas",
        keywords: ["duplicar", "copiar", "clonar", "duplicação"],
        content:
          "Para duplicar campanhas existentes:\n\n1. Selecione as campanhas que deseja duplicar na tabela\n2. Clique em **Duplicar** na barra de ações em massa\n3. Confirme a operação no diálogo\n\nVocê pode duplicar até 100 campanhas por vez. A duplicação cria cópias idênticas das campanhas selecionadas, incluindo configurações de público e orçamento. As cópias são criadas com o status de Rascunho.",
      },
      {
        id: "adsets-ads",
        title: "Conjuntos de Anúncios e Anúncios",
        keywords: ["conjunto", "anúncio", "ad set", "criativo", "segmentação"],
        content:
          "A estrutura de campanhas no Meta segue uma hierarquia de 3 níveis:\n\n1. **Campanha** — Define o objetivo e orçamento geral\n2. **Conjunto de Anúncios (Ad Set)** — Define o público-alvo, posicionamento, programação e orçamento do conjunto\n3. **Anúncio (Ad)** — O criativo em si (imagem, vídeo, texto, link)\n\nPara acessar os conjuntos e anúncios, clique em uma campanha na lista. Você verá as tabs para navegar entre os conjuntos de anúncios e os anúncios individuais de cada conjunto.",
      },
      {
        id: "filters-search",
        title: "Filtros e Busca",
        keywords: ["filtro", "busca", "pesquisa", "buscar", "filtrar"],
        content:
          "Na página de Campanhas, você pode:\n\n- **Buscar** — Use a barra de pesquisa para encontrar campanhas pelo nome\n- **Filtrar por status** — Use o dropdown de status para mostrar apenas campanhas Ativas, Pausadas ou Arquivadas\n- **Mostrar arquivadas** — Ative o toggle para incluir campanhas arquivadas nos resultados\n\nOs filtros são combinados, permitindo buscar por nome dentro de um status específico.",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Métricas, gráficos e análise de desempenho",
    sections: [
      {
        id: "dashboard-metrics",
        title: "Entendendo o Dashboard",
        keywords: ["dashboard", "painel", "métricas", "visão geral"],
        content:
          "O Dashboard mostra um resumo das métricas mais importantes da sua conta:\n\n- **Gasto Total** — Quanto foi investido no período selecionado\n- **Orçamento** — Progresso do orçamento mensal configurado\n- **Campanhas Ativas** — Número de campanhas em execução\n- **Alertas** — Notificações recentes que precisam de atenção\n\nAs métricas são atualizadas a cada sincronização com a API do Meta. Use o botão de atualização no topo para forçar uma sincronização.",
      },
      {
        id: "main-metrics",
        title: "Métricas Principais",
        keywords: ["CPC", "CTR", "ROAS", "CPM", "impressões", "cliques", "conversões"],
        content:
          "Entenda as métricas mais importantes para avaliar suas campanhas:\n\n- **CPC (Custo por Clique)** — Quanto você paga em média por cada clique. Valores menores indicam melhor eficiência.\n- **CTR (Taxa de Cliques)** — Percentual de pessoas que clicaram após ver o anúncio. Quanto maior, mais atrativo é o criativo.\n- **CPM (Custo por Mil Impressões)** — Custo para exibir 1.000 vezes. Indicador de competitividade do leilão.\n- **ROAS (Retorno sobre Investimento)** — Receita gerada para cada R$1 investido. ROAS > 1 significa lucro.\n- **Impressões** — Total de vezes que seus anúncios foram exibidos.\n- **Alcance** — Número de pessoas únicas que viram seus anúncios.\n- **Conversões** — Ações valiosas realizadas (leads, compras, etc).\n- **Frequência** — Média de vezes que cada pessoa viu seu anúncio.",
      },
      {
        id: "period-analysis",
        title: "Análise por Período",
        keywords: ["período", "data", "7 dias", "14 dias", "30 dias", "tempo"],
        content:
          "Na página de Analytics, você pode analisar métricas em diferentes períodos:\n\n- **Últimos 7 dias** — Visão de curto prazo, ideal para acompanhamento diário\n- **Últimos 14 dias** — Visão intermediária para identificar tendências\n- **Últimos 30 dias** — Visão mensal para análise de performance geral\n\nUse o seletor de período no canto superior direito para alternar entre os períodos. Todas as métricas e gráficos serão atualizados automaticamente.",
      },
      {
        id: "breakdowns-trends",
        title: "Breakdowns e Tendências",
        keywords: ["breakdown", "tendência", "gráfico", "evolução", "diário"],
        content:
          "A aba **Tendências** mostra a evolução diária do gasto com um gráfico de barras interativo. Ao passar o mouse, você vê o valor exato e a variação percentual em relação ao dia anterior.\n\nA aba **Breakdown** permite analisar as campanhas por diferentes dimensões, como idade, gênero e posicionamento. Selecione uma dimensão e uma métrica para explorar os dados.\n\nAs abas **Conjuntos** e **Anúncios** mostram rankings por gasto com barras visuais e tabelas detalhadas, permitindo identificar rapidamente os melhores e piores performers.",
      },
    ],
  },
  {
    id: "agent",
    label: "Agente IA",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "Assistente inteligente para análise de campanhas",
    sections: [
      {
        id: "how-to-use-agent",
        title: "Como Usar o Agente de IA",
        keywords: ["agente", "IA", "chat", "perguntar", "inteligência artificial"],
        content:
          "O Agente IA é um assistente inteligente que pode ajudá-lo a analisar dados das suas campanhas. Para usá-lo:\n\n1. Acesse **Agente IA** no menu lateral\n2. Digite sua pergunta ou solicitação no campo de mensagem\n3. Aguarde a resposta do agente\n\nO agente tem acesso aos dados da sua conta de anúncios selecionada e pode consultar métricas, analisar tendências e sugerir otimizações.",
      },
      {
        id: "question-types",
        title: "Tipos de Perguntas que Pode Fazer",
        keywords: ["perguntas", "exemplos", "o que perguntar", "consultas"],
        content:
          "O agente pode ajudar com diversos tipos de análise:\n\n**Métricas e Performance:**\n- \"Qual o CPC médio das minhas campanhas ativas?\"\n- \"Qual campanha tem o melhor ROAS?\"\n- \"Como está o gasto este mês?\"\n\n**Comparações:**\n- \"Compare o desempenho das campanhas de tráfego vs leads\"\n- \"Quais anúncios estão performando melhor?\"\n\n**Recomendações:**\n- \"Quais campanhas devo pausar?\"\n- \"Como posso melhorar o CTR?\"\n- \"Algum alerta que preciso verificar?\"\n\n**Relatórios:**\n- \"Me dê um resumo da performance semanal\"\n- \"Quais são as principais métricas do mês?\"",
      },
      {
        id: "whatsapp-integration",
        title: "Integração com WhatsApp",
        keywords: ["whatsapp", "mensagem", "celular", "evolution", "notificação"],
        content:
          "Você pode interagir com o agente via WhatsApp para receber relatórios e fazer consultas diretamente do celular:\n\n1. Em **Configurações > WhatsApp**, habilite a integração\n2. Configure as credenciais da Evolution API (URL, API Key, Instância)\n3. Adicione os números autorizados a interagir com o agente\n4. Teste a integração enviando uma mensagem de teste\n\nVocê também pode configurar o envio automático de relatórios diários no horário desejado em Configurações > Notificações.",
      },
    ],
  },
  {
    id: "settings",
    label: "Configurações",
    icon: <Settings className="h-4 w-4" />,
    description: "Integrações, orçamento e preferências do sistema",
    sections: [
      {
        id: "meta-api-setup",
        title: "Conectar a Meta API",
        keywords: ["meta", "api", "token", "access token", "business id", "conectar"],
        content:
          "Para conectar sua conta do Meta à plataforma:\n\n1. Acesse **Configurações > Meta API**\n2. Preencha os campos:\n   - **Access Token** — Obtenha no Graph API Explorer (developers.facebook.com/tools/explorer/) com as permissões: ads_read, ads_management, business_management\n   - **Business ID** — Encontre em business.facebook.com/settings, na URL (business_id=XXX)\n   - **Ad Account ID** — Encontre no Gerenciador de Anúncios, na URL da conta\n3. Clique em **Testar Conexão** para verificar as credenciais\n4. Salve as configurações\n\nApós conectar, a plataforma sincronizará automaticamente as campanhas e métricas da sua conta.",
      },
      {
        id: "budget-alerts",
        title: "Configurar Orçamento e Alertas",
        keywords: ["orçamento", "budget", "alerta", "limite", "notificação"],
        content:
          "Configure o controle de orçamento em **Configurações > Orçamento**:\n\n- **Limite Mensal** — Defina o valor máximo de investimento por mês\n- **Alerta em 50%** — Notifica quando metade do orçamento foi gasto\n- **Alerta em 80%** — Alerta de atenção antes de atingir o limite\n- **Alerta em 100%** — Notifica quando o limite é atingido\n- **Projeção de Excesso** — Alerta se a projeção indicar que o limite será ultrapassado\n\nOs alertas aparecem na aba Alertas e no ícone de sino no topo da página.",
      },
      {
        id: "whatsapp-setup",
        title: "Configurar WhatsApp (Evolution API)",
        keywords: ["whatsapp", "evolution", "api", "configurar", "instância"],
        content:
          "Para configurar o acesso via WhatsApp:\n\n1. Em **Configurações > WhatsApp**, habilite a integração\n2. Preencha as credenciais da Evolution API:\n   - **URL da API** — Endereço da sua instância Evolution\n   - **API Key** — Chave de autenticação\n   - **Nome da Instância** — Identificador da instância\n   - **Webhook Secret** (opcional) — Para validação de webhooks\n3. Adicione os **números permitidos** — Apenas esses números poderão interagir com o agente\n4. Use **Enviar Mensagem de Teste** para verificar a configuração\n\nO webhook deve ser configurado na Evolution apontando para: [URL-do-backend]/api/whatsapp/webhook",
      },
      {
        id: "performance-goals",
        title: "Metas de Performance",
        keywords: ["metas", "performance", "conversão", "ROAS", "CPC", "CTR", "objetivo"],
        content:
          "Defina metas para monitorar a performance em **Configurações > Metas**:\n\n- **Meta de Conversões** — Número de conversões desejadas por período\n- **Meta de ROAS** — Retorno mínimo sobre investimento (ex: 3.0x)\n- **CPC Máximo** — Custo por clique máximo aceitável (ex: R$ 2,00)\n- **CTR Mínimo** — Taxa de cliques mínima esperada (ex: 1.0%)\n\nQuando uma métrica estiver abaixo da meta, o sistema gerará alertas automaticamente para que você tome ação.",
      },
    ],
  },
  {
    id: "faq",
    label: "FAQ",
    icon: <HelpCircle className="h-4 w-4" />,
    description: "Perguntas frequentes e solução de problemas",
    sections: [
      {
        id: "faq-token-expired",
        title: "Meu Access Token expirou. O que fazer?",
        keywords: ["token", "expirou", "expirado", "renovar", "erro"],
        content:
          "Os tokens do Meta expiram periodicamente. Para renová-lo:\n\n1. Acesse o Graph API Explorer (developers.facebook.com/tools/explorer/)\n2. Selecione seu aplicativo\n3. Marque as permissões: ads_read, ads_management, business_management\n4. Clique em \"Gerar Token de Acesso\"\n5. Copie o novo token e cole em Configurações > Meta API\n6. Teste a conexão e salve\n\nPara tokens de longa duração, considere configurar um System User no Business Manager.",
      },
      {
        id: "faq-no-data",
        title: "As métricas estão zeradas ou não carregam",
        keywords: ["zerado", "zero", "não carrega", "vazio", "sem dados"],
        content:
          "Se as métricas não estão aparecendo:\n\n1. **Verifique a conta selecionada** — Use o seletor no topo para garantir que a conta correta está selecionada\n2. **Verifique o período** — Certifique-se de que há campanhas ativas no período selecionado\n3. **Teste a conexão** — Em Configurações > Meta API, clique em \"Testar Conexão\"\n4. **Sincronize** — Use o botão de atualização no topo da página\n5. **Verifique o Access Token** — Tokens expirados podem causar falha na coleta de dados",
      },
      {
        id: "faq-budget-exceeded",
        title: "O orçamento mensal foi excedido. E agora?",
        keywords: ["orçamento", "excedeu", "limite", "excesso", "gasto"],
        content:
          "Se o orçamento mensal foi excedido:\n\n1. Verifique quais campanhas estão com maior gasto em Analytics > Campanhas\n2. Considere pausar campanhas com baixo ROAS\n3. Ajuste os orçamentos diários das campanhas restantes\n4. Em Configurações > Orçamento, ative os alertas de projeção para evitar que isso se repita\n\nO sistema mostra o progresso do orçamento na barra lateral para que você acompanhe em tempo real.",
      },
      {
        id: "faq-whatsapp-not-working",
        title: "O WhatsApp não está enviando mensagens",
        keywords: ["whatsapp", "não envia", "erro", "mensagem", "evolution"],
        content:
          "Se as mensagens do WhatsApp não estão sendo entregues:\n\n1. **Verifique se está habilitado** — Em Configurações > WhatsApp, o toggle deve estar ativo\n2. **Verifique as credenciais** — URL, API Key e instância devem estar corretos\n3. **Verifique os números** — O número destinatário deve estar na lista de permitidos\n4. **Teste a conexão** — Use \"Enviar Mensagem de Teste\" para diagnosticar\n5. **Verifique o scheduler** — O status do scheduler deve estar \"Ativo\"\n6. **Verifique a instância Evolution** — Confirme que a instância está online e conectada ao WhatsApp",
      },
      {
        id: "faq-dark-mode",
        title: "Como ativar o modo escuro?",
        keywords: ["modo escuro", "dark mode", "tema", "escuro", "claro"],
        content:
          "Para alternar entre temas:\n\n1. Clique no ícone de sol/lua no canto superior direito da página\n2. Escolha entre:\n   - **Claro** — Tema com fundo branco\n   - **Escuro** — Tema com fundo escuro, ideal para uso noturno\n   - **Sistema** — Segue a preferência do sistema operacional\n\nA preferência de tema é salva automaticamente e persistida entre sessões.",
      },
      {
        id: "faq-multiple-accounts",
        title: "Posso gerenciar múltiplas contas de anúncios?",
        keywords: ["múltiplas contas", "várias contas", "trocar conta", "conta"],
        content:
          "Sim! A plataforma suporta múltiplas contas de anúncios vinculadas ao mesmo Business ID:\n\n1. Configure o Business ID em Configurações > Meta API\n2. Após conectar, todas as contas vinculadas ao Business aparecerão no seletor\n3. Use o **seletor de conta** no topo da página para alternar entre elas\n4. Cada página mostrará os dados da conta selecionada\n\nA seleção é salva automaticamente, então ao reabrir a plataforma, a última conta usada será restaurada.",
      },
    ],
  },
]

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === query.toLowerCase()
    return isMatch ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  })
}

function renderContent(content: string, searchQuery: string): React.ReactNode {
  const lines = content.split("\n")

  return lines.map((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) return <br key={index} />

    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*(.*)$/)
    const listItemMatch = trimmed.match(/^(\d+\.\s+|- )(.+)$/)
    const subListMatch = trimmed.match(/^   (\d+\.\s+|- )(.+)$/)

    if (subListMatch) {
      const itemContent = subListMatch[2]
      const boldParts = itemContent.split(/(\*\*[^*]+\*\*)/)
      return (
        <li key={index} className="ml-8 text-muted-foreground list-disc">
          {boldParts.map((part, i) => {
            const innerBold = part.match(/^\*\*(.+)\*\*$/)
            if (innerBold) {
              return (
                <span key={i} className="font-semibold text-foreground">
                  {highlightText(innerBold[1], searchQuery)}
                </span>
              )
            }
            return <span key={i}>{highlightText(part, searchQuery)}</span>
          })}
        </li>
      )
    }

    if (listItemMatch) {
      const prefix = listItemMatch[1]
      const itemContent = listItemMatch[2]
      const isOrdered = /^\d+\./.test(prefix)
      const boldParts = itemContent.split(/(\*\*[^*]+\*\*)/)

      return (
        <li
          key={index}
          className={`ml-4 text-muted-foreground ${isOrdered ? "list-decimal" : "list-disc"}`}
        >
          {boldParts.map((part, i) => {
            const innerBold = part.match(/^\*\*(.+)\*\*$/)
            if (innerBold) {
              return (
                <span key={i} className="font-semibold text-foreground">
                  {highlightText(innerBold[1], searchQuery)}
                </span>
              )
            }
            return <span key={i}>{highlightText(part, searchQuery)}</span>
          })}
        </li>
      )
    }

    if (boldMatch) {
      return (
        <p key={index} className="text-muted-foreground">
          <span className="font-semibold text-foreground">
            {highlightText(boldMatch[1], searchQuery)}
          </span>
          {highlightText(boldMatch[2], searchQuery)}
        </p>
      )
    }

    const inlineBoldParts = trimmed.split(/(\*\*[^*]+\*\*)/)
    return (
      <p key={index} className="text-muted-foreground">
        {inlineBoldParts.map((part, i) => {
          const innerBold = part.match(/^\*\*(.+)\*\*$/)
          if (innerBold) {
            return (
              <span key={i} className="font-semibold text-foreground">
                {highlightText(innerBold[1], searchQuery)}
              </span>
            )
          }
          return <span key={i}>{highlightText(part, searchQuery)}</span>
        })}
      </p>
    )
  })
}

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return docCategories

    const query = searchQuery.toLowerCase()

    return docCategories
      .map((category) => {
        const filteredSections = category.sections.filter((section) => {
          const matchesTitle = section.title.toLowerCase().includes(query)
          const matchesContent = section.content.toLowerCase().includes(query)
          const matchesKeywords = section.keywords.some((kw) => kw.includes(query))
          return matchesTitle || matchesContent || matchesKeywords
        })

        return { ...category, sections: filteredSections }
      })
      .filter((category) => category.sections.length > 0)
  }, [searchQuery])

  const totalResults = filteredCategories.reduce(
    (acc, cat) => acc + cat.sections.length,
    0
  )

  const defaultTab = filteredCategories.length > 0 ? filteredCategories[0].id : "quick-start"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
        <p className="text-muted-foreground">
          Guia completo para usar o Meta Campaign Manager
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar na documentação... (ex: ROAS, criar campanha, whatsapp)"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <div className="mt-2 text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? "resultado encontrado" : "resultados encontrados"}
          </div>
        )}
      </div>

      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Nenhum resultado encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente buscar por outros termos como &quot;campanha&quot;, &quot;ROAS&quot; ou
              &quot;configurações&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={defaultTab} key={defaultTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            {filteredCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                {category.icon}
                {category.label}
                {searchQuery && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {category.sections.length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {filteredCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.icon}
                    {category.label}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {category.sections.map((section) => (
                      <AccordionItem key={section.id} value={section.id}>
                        <AccordionTrigger className="text-left">
                          {highlightText(section.title, searchQuery)}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 leading-relaxed">
                            {renderContent(section.content, searchQuery)}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
