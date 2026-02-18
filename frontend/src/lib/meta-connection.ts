export interface MetaConnectionStatus {
  isConnected: boolean
  businessName?: string
  multiAccounts?: boolean
  multiBusinesses?: boolean
  error?: string
  errorDescription?: string
}

export function parseMetaConnectionParams(
  searchParams: URLSearchParams
): MetaConnectionStatus {
  const metaConnected = searchParams.get("meta_connected") === "true"
  const businessName = searchParams.get("business_name") || undefined
  const multiAccounts = searchParams.get("multi_accounts") === "true"
  const multiBusinesses = searchParams.get("multi_businesses") === "true"
  const metaError = searchParams.get("meta_error") || undefined
  const metaErrorDescription =
    searchParams.get("meta_error_description") || undefined

  if (metaConnected) {
    return { isConnected: true, businessName, multiAccounts, multiBusinesses }
  }

  if (metaError) {
    return {
      isConnected: false,
      error: metaError,
      errorDescription: metaErrorDescription,
    }
  }

  return { isConnected: false }
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_config:
    "Configuracao do Facebook Login nao encontrada. Verifique as variaveis de ambiente.",
  missing_params: "Parametros ausentes na resposta do Facebook.",
  invalid_state: "Validacao de seguranca falhou. Tente novamente.",
  access_denied:
    "Acesso negado. Voce precisa autorizar o aplicativo para continuar.",
  missing_scopes:
    "Permissoes insuficientes. Reconecte e autorize todas as permissoes solicitadas.",
  unexpected_error: "Ocorreu um erro inesperado. Tente novamente.",
}

export function getMetaErrorMessage(
  error: string,
  description?: string
): string {
  if (error === "token_exchange_failed") {
    return description || "Falha ao obter token de acesso."
  }

  return (
    ERROR_MESSAGES[error] ||
    description ||
    "Erro desconhecido ao conectar com Facebook."
  )
}

export function getTokenExpirationStatus(
  tokenExpiresAt: string | null | undefined
): { label: string; variant: "default" | "warning" | "expired" } {
  if (!tokenExpiresAt) {
    return { label: "Nunca expira", variant: "default" }
  }

  const expiresDate = new Date(tokenExpiresAt)
  const now = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry <= 0) {
    return { label: "Token expirado", variant: "expired" }
  }

  if (daysUntilExpiry <= 7) {
    return {
      label: `Expira em ${daysUntilExpiry} dia${daysUntilExpiry > 1 ? "s" : ""}`,
      variant: "warning",
    }
  }

  const formatted = expiresDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  return { label: `Expira em ${formatted}`, variant: "default" }
}
