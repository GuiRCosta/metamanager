export const metadata = {
  title: "Termos de Servico | IDEVA",
  description: "Termos de Servico da plataforma de gestao de campanhas publicitarias da IDEVA.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-page-bg">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Termos de Servico
        </h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Ultima atualizacao: 12 de fevereiro de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <Section title="1. Aceitacao dos Termos">
            <p>
              Ao acessar ou utilizar a plataforma de gestao de campanhas
              publicitarias (doravante &quot;Plataforma&quot;) operada pela{" "}
              <strong>IDEVA LTDA</strong>, inscrita no CNPJ sob o n.
              64.785.647/0001-59, voce concorda com estes Termos de Servico. Se
              voce nao concordar, nao utilize a Plataforma.
            </p>
          </Section>

          <Section title="2. Descricao do Servico">
            <p>
              A Plataforma e uma ferramenta de gestao de campanhas publicitarias
              que permite aos usuarios:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Conectar suas contas publicitarias do Facebook e Instagram via
                Facebook Login for Business.
              </li>
              <li>
                Visualizar e gerenciar Business Managers e Ad Accounts.
              </li>
              <li>
                Criar, editar e otimizar campanhas, conjuntos de anuncios e
                anuncios.
              </li>
              <li>
                Acompanhar metricas de desempenho por meio de dashboards e
                relatorios.
              </li>
              <li>
                Receber sugestoes de otimizacao baseadas em inteligencia
                artificial.
              </li>
            </ul>
          </Section>

          <Section title="3. Cadastro e Conta">
            <p>
              Para utilizar a Plataforma, voce deve criar uma conta fornecendo
              informacoes verdadeiras e atualizadas. Voce e responsavel por
              manter a confidencialidade de suas credenciais de acesso e por
              todas as atividades realizadas em sua conta.
            </p>
          </Section>

          <Section title="4. Conexao com a Meta">
            <p>
              Ao conectar sua conta Meta por meio do Facebook Login for Business,
              voce autoriza a Plataforma a acessar os ativos selecionados
              (Business Managers, Ad Accounts, Pages) e a realizar operacoes em
              seu nome, conforme as permissoes concedidas.
            </p>
            <p>
              A IDEVA nao se responsabiliza por alteracoes nas politicas da Meta
              Platforms, Inc. que possam afetar o funcionamento da Plataforma.
            </p>
          </Section>

          <Section title="5. Responsabilidades do Usuario">
            <p>O usuario se compromete a:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Utilizar a Plataforma em conformidade com as leis aplicaveis e
                as politicas de publicidade da Meta.
              </li>
              <li>
                Nao utilizar a Plataforma para veicular conteudo ilegal,
                enganoso ou que viole direitos de terceiros.
              </li>
              <li>
                Manter suas credenciais de acesso em sigilo e notificar
                imediatamente a IDEVA em caso de uso nao autorizado.
              </li>
              <li>
                Garantir que possui autorizacao para gerenciar as contas
                publicitarias conectadas.
              </li>
            </ul>
          </Section>

          <Section title="6. Limitacoes de Uso">
            <p>A Plataforma nao deve ser utilizada para:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Acessar dados de contas publicitarias sem autorizacao do
                proprietario.
              </li>
              <li>
                Realizar engenharia reversa, descompilar ou tentar extrair o
                codigo-fonte da Plataforma.
              </li>
              <li>
                Sobrecarregar os servidores com requisicoes automatizadas
                excessivas.
              </li>
              <li>
                Revender ou sublicenciar o acesso a Plataforma sem autorizacao
                da IDEVA.
              </li>
            </ul>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>
              Todos os direitos de propriedade intelectual sobre a Plataforma,
              incluindo codigo, design, marcas e conteudo, pertencem a IDEVA
              LTDA. O uso da Plataforma nao confere ao usuario nenhum direito
              sobre esses elementos.
            </p>
          </Section>

          <Section title="8. Disponibilidade do Servico">
            <p>
              A IDEVA se esforca para manter a Plataforma disponivel de forma
              continua, mas nao garante disponibilidade ininterrupta. O servico
              pode ser temporariamente indisponivel para manutencao,
              atualizacoes ou por motivos fora do controle da IDEVA.
            </p>
          </Section>

          <Section title="9. Limitacao de Responsabilidade">
            <p>
              A IDEVA nao se responsabiliza por perdas financeiras decorrentes de
              decisoes de investimento publicitario tomadas com base nos dados
              exibidos na Plataforma. Os dados de metricas sao obtidos
              diretamente da Meta e exibidos &quot;como estao&quot;.
            </p>
          </Section>

          <Section title="10. Cancelamento">
            <p>
              O usuario pode cancelar sua conta a qualquer momento por meio das
              configuracoes da Plataforma. Apos o cancelamento, os dados serao
              tratados conforme descrito na Politica de Privacidade.
            </p>
            <p>
              A IDEVA reserva-se o direito de suspender ou encerrar contas que
              violem estes Termos de Servico.
            </p>
          </Section>

          <Section title="11. Alteracoes nos Termos">
            <p>
              A IDEVA pode alterar estes Termos a qualquer momento. Alteracoes
              significativas serao comunicadas por e-mail ou por aviso na
              Plataforma com antecedencia de 15 dias. O uso continuado da
              Plataforma apos a notificacao constitui aceitacao dos novos termos.
            </p>
          </Section>

          <Section title="12. Legislacao Aplicavel">
            <p>
              Estes Termos sao regidos pelas leis da Republica Federativa do
              Brasil. Fica eleito o foro da comarca da sede da IDEVA LTDA para
              dirimir quaisquer controversias.
            </p>
          </Section>

          <Section title="13. Contato">
            <p>
              Para duvidas sobre estes Termos, entre em contato:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                E-mail: <strong>contato@ideva.ai</strong>
              </li>
              <li>
                Empresa: IDEVA LTDA - CNPJ: 64.785.647/0001-59
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}
