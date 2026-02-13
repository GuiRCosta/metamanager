export const metadata = {
  title: "Politica de Privacidade | IDEVA",
  description: "Politica de Privacidade da plataforma de gestao de campanhas publicitarias da IDEVA.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-page-bg">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Politica de Privacidade
        </h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Ultima atualizacao: 12 de fevereiro de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <Section title="1. Identificacao do Controlador">
            <p>
              <strong>IDEVA LTDA</strong> (doravante &quot;IDEVA&quot;), inscrita
              no CNPJ sob o n. 64.785.647/0001-59, e a controladora dos dados
              pessoais coletados por meio da plataforma de gestao de campanhas
              publicitarias (doravante &quot;Plataforma&quot;).
            </p>
            <p>
              Contato: <strong>contato@ideva.ai</strong>
            </p>
          </Section>

          <Section title="2. Dados Coletados">
            <p>Ao utilizar a Plataforma, coletamos:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong>Dados de cadastro:</strong> nome, e-mail e senha
                (armazenada de forma criptografada).
              </li>
              <li>
                <strong>Dados da conta Meta:</strong> ao conectar sua conta via
                Facebook Login for Business, acessamos seu nome de usuario,
                Business Managers, Ad Accounts e Pages que voce autorizar.
              </li>
              <li>
                <strong>Dados de campanhas:</strong> metricas de desempenho
                (impressoes, cliques, gastos, conversoes, CTR, CPM) das contas
                publicitarias selecionadas.
              </li>
              <li>
                <strong>Dados de uso:</strong> informacoes sobre como voce
                interage com a Plataforma para fins de melhoria do servico.
              </li>
            </ul>
          </Section>

          <Section title="3. Finalidade do Tratamento">
            <p>Os dados sao utilizados exclusivamente para:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Permitir o gerenciamento de campanhas publicitarias no Facebook e
                Instagram.
              </li>
              <li>
                Exibir dashboards e relatorios de performance das campanhas.
              </li>
              <li>Criar, editar e otimizar anuncios nas contas selecionadas.</li>
              <li>
                Fornecer sugestoes de otimizacao por meio de inteligencia
                artificial.
              </li>
            </ul>
          </Section>

          <Section title="4. Compartilhamento de Dados">
            <p>
              A IDEVA <strong>nao vende, aluga ou compartilha</strong> seus dados
              pessoais com terceiros para fins de marketing. Os dados podem ser
              compartilhados apenas:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Com a <strong>Meta Platforms, Inc.</strong>, por meio da Graph
                API, para execucao das funcionalidades da Plataforma.
              </li>
              <li>
                Com provedores de infraestrutura (hosting), exclusivamente para
                operacao tecnica do servico.
              </li>
              <li>Quando exigido por lei ou ordem judicial.</li>
            </ul>
          </Section>

          <Section title="5. Armazenamento e Seguranca">
            <p>
              Os dados sao armazenados em servidores seguros. Senhas sao
              criptografadas com bcrypt. Tokens de acesso da Meta sao
              armazenados de forma segura e utilizados exclusivamente para as
              operacoes autorizadas pelo usuario.
            </p>
          </Section>

          <Section title="6. Retencao de Dados">
            <p>
              Os dados sao mantidos enquanto sua conta estiver ativa. Dados de
              metricas de campanhas sao retidos por ate 12 meses apos a ultima
              sincronizacao. Apos o encerramento da conta, todos os dados sao
              excluidos em ate 30 dias.
            </p>
          </Section>

          <Section title="7. Seus Direitos">
            <p>
              Em conformidade com a LGPD (Lei Geral de Protecao de Dados), voce
              tem direito a:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusao dos seus dados.</li>
              <li>
                Revogar o consentimento a qualquer momento, desconectando sua
                conta Meta nas configuracoes da Plataforma.
              </li>
              <li>Solicitar a portabilidade dos seus dados.</li>
            </ul>
          </Section>

          <Section title="8. Revogacao de Acesso">
            <p>
              Voce pode revogar o acesso da Plataforma aos seus dados da Meta a
              qualquer momento:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Na Plataforma: acesse <strong>Configuracoes</strong> e clique em{" "}
                <strong>&quot;Desconectar conta Meta&quot;</strong>.
              </li>
              <li>
                No Facebook: acesse{" "}
                <strong>
                  Configuracoes &gt; Seguranca e login &gt; Apps e sites
                </strong>{" "}
                e remova o acesso da Plataforma.
              </li>
            </ul>
          </Section>

          <Section title="9. Contato">
            <p>
              Para exercer seus direitos ou esclarecer duvidas sobre esta
              politica, entre em contato:
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

          <Section title="10. Alteracoes nesta Politica">
            <p>
              Esta politica pode ser atualizada periodicamente. Notificaremos os
              usuarios sobre alteracoes significativas por e-mail ou por aviso na
              Plataforma.
            </p>
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
