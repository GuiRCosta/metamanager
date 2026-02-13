export interface MetaConnectionStatus {
  isConnected: boolean
  businessName?: string
  error?: string
  errorDescription?: string
}

export function parseMetaConnectionParams(
  searchParams: URLSearchParams
): MetaConnectionStatus {
  const metaConnected = searchParams.get("meta_connected") === "true"
  const businessName = searchParams.get("business_name") || undefined
  const metaError = searchParams.get("meta_error") || undefined
  const metaErrorDescription =
    searchParams.get("meta_error_description") || undefined

  if (metaConnected) {
    return { isConnected: true, businessName }
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
