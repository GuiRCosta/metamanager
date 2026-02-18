import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8000"
const GRAPH_API_VERSION = "v22.0"
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

function getRedirectUri() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  return `${baseUrl}/api/auth/callback/facebook`
}

function settingsRedirect(
  baseUrl: string,
  params: Record<string, string>
): NextResponse {
  const url = new URL("/settings", baseUrl)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return NextResponse.redirect(url)
}

interface GraphApiError {
  error?: {
    message?: string
    type?: string
    code?: number
  }
}

interface TokenResponse {
  access_token: string
  token_type?: string
}

interface AssignedAdAccount {
  id: string
  account_id: string
  name?: string
  account_status?: number
}

interface AdAccountBusiness {
  business?: {
    id: string
    name: string
  }
}

interface TokenDebugData {
  data?: {
    expires_at?: number
    data_access_expires_at?: number
    is_valid?: boolean
    scopes?: string[]
  }
}

interface FacebookPage {
  id: string
  name: string
}

async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID!,
    client_secret: FACEBOOK_APP_SECRET!,
    redirect_uri: getRedirectUri(),
    code,
  })

  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`
  )

  if (!response.ok) {
    const errorData: GraphApiError = await response.json()
    throw new Error(
      errorData?.error?.message || "Falha na troca do codigo por token"
    )
  }

  return response.json()
}

async function fetchAssignedAdAccounts(
  accessToken: string
): Promise<AssignedAdAccount[]> {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,account_id,account_status",
  })

  const response = await fetch(
    `${GRAPH_API_BASE}/me/assigned_ad_accounts?${params.toString()}`
  )

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data.data || []
}

async function fetchBusinessFromAdAccount(
  accessToken: string,
  adAccountId: string
): Promise<AdAccountBusiness> {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "business",
  })

  const response = await fetch(
    `${GRAPH_API_BASE}/${adAccountId}?${params.toString()}`
  )

  if (!response.ok) {
    return {}
  }

  return response.json()
}

async function debugToken(accessToken: string): Promise<TokenDebugData> {
  const params = new URLSearchParams({
    input_token: accessToken,
    access_token: `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
  })

  const response = await fetch(
    `${GRAPH_API_BASE}/debug_token?${params.toString()}`
  )

  if (!response.ok) {
    return {}
  }

  return response.json()
}

async function fetchPages(accessToken: string): Promise<FacebookPage[]> {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name",
  })

  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?${params.toString()}`
  )

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data.data || []
}

async function saveSettingsToBackend(
  settings: {
    access_token: string
    business_id: string
    ad_account_id: string
    page_id: string
    api_version: string
    token_expires_at?: string
  },
  userId?: string
): Promise<void> {
  const params = userId ? `?user_id=${userId}` : ""
  const response = await fetch(`${BACKEND_URL}/api/settings${params}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meta_api: settings }),
  })

  if (!response.ok) {
    throw new Error("Falha ao salvar configuracoes no backend")
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  try {
    const session = await auth()
    if (!session) {
      return NextResponse.redirect(new URL("/login", baseUrl))
    }

    const { searchParams } = request.nextUrl
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    if (error) {
      return settingsRedirect(baseUrl, {
        meta_error: error,
        ...(errorDescription
          ? { meta_error_description: errorDescription }
          : {}),
      })
    }

    if (!code || !state) {
      return settingsRedirect(baseUrl, { meta_error: "missing_params" })
    }

    const cookieStore = await cookies()
    const storedState = cookieStore.get("meta_oauth_state")?.value
    cookieStore.delete("meta_oauth_state")

    if (!storedState || storedState !== state) {
      return settingsRedirect(baseUrl, { meta_error: "invalid_state" })
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return settingsRedirect(baseUrl, {
        meta_error: "missing_config",
        meta_error_description: "Facebook App ID ou Secret nao configurados",
      })
    }

    const tokenData = await exchangeCodeForToken(code)
    const accessToken = tokenData.access_token

    // Fetch ad accounts, token debug info, and pages in parallel
    const [adAccounts, tokenDebug, pages] = await Promise.all([
      fetchAssignedAdAccounts(accessToken),
      debugToken(accessToken),
      fetchPages(accessToken),
    ])

    const firstAccount = adAccounts[0]
    const adAccountId = firstAccount?.account_id || ""

    // Validate required scopes
    const REQUIRED_SCOPES = ["ads_management", "ads_read"]
    const grantedScopes = tokenDebug.data?.scopes || []
    const missingScopes = REQUIRED_SCOPES.filter(
      (scope) => !grantedScopes.includes(scope)
    )

    if (missingScopes.length > 0) {
      return settingsRedirect(baseUrl, {
        meta_error: "missing_scopes",
        meta_error_description: `Permissoes ausentes: ${missingScopes.join(", ")}. Reconecte e autorize todas as permissoes.`,
      })
    }

    // Extract token expiration (0 = never expires, which is typical for SUAT)
    const expiresAt = tokenDebug.data?.expires_at
    const tokenExpiresAt =
      expiresAt && expiresAt > 0
        ? new Date(expiresAt * 1000).toISOString()
        : undefined

    // Use first page found (if any)
    const pageId = pages[0]?.id || ""

    // Collect unique businesses from all ad accounts
    const businessMap = new Map<string, string>()
    const businessFetches = adAccounts.map(async (account) => {
      const details = await fetchBusinessFromAdAccount(
        accessToken,
        account.id
      )
      if (details.business?.id) {
        businessMap.set(details.business.id, details.business.name)
      }
    })
    await Promise.all(businessFetches)

    // Use first business found (fallback to the one from firstAccount)
    const firstBusiness = businessMap.entries().next().value
    const businessId = firstBusiness?.[0] || ""
    const businessName = firstBusiness?.[1] || ""

    const userId = (session.user as { id?: string })?.id
    await saveSettingsToBackend(
      {
        access_token: accessToken,
        business_id: businessId,
        ad_account_id: adAccountId,
        page_id: pageId,
        api_version: GRAPH_API_VERSION,
        ...(tokenExpiresAt ? { token_expires_at: tokenExpiresAt } : {}),
      },
      userId
    )

    const redirectParams: Record<string, string> = {
      meta_connected: "true",
    }
    if (businessName) {
      redirectParams.business_name = businessName
    }
    if (adAccounts.length > 1) {
      redirectParams.multi_accounts = "true"
    }
    if (businessMap.size > 1) {
      redirectParams.multi_businesses = "true"
    }

    return settingsRedirect(baseUrl, redirectParams)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro inesperado"

    return settingsRedirect(baseUrl, {
      meta_error: "token_exchange_failed",
      meta_error_description: message,
    })
  }
}
