import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8000"
const GRAPH_API_VERSION = "v22.0"
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export async function POST() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    const userId = (session.user as { id?: string })?.id

    // Load current settings to get the access token
    const settingsParams = userId ? `?user_id=${userId}` : ""
    const settingsRes = await fetch(
      `${BACKEND_URL}/api/settings${settingsParams}`
    )
    const settings = settingsRes.ok ? await settingsRes.json() : null
    const accessToken = settings?.meta_api?.access_token

    // Revoke permissions on Meta side (best-effort)
    if (accessToken) {
      try {
        await fetch(`${GRAPH_API_BASE}/me/permissions`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      } catch {
        // Revocation failure should not block disconnect
      }
    }

    // Clear meta settings in backend
    const clearRes = await fetch(
      `${BACKEND_URL}/api/settings${settingsParams}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta_api: {
            access_token: "",
            business_id: "",
            ad_account_id: "",
            page_id: "",
            api_version: "v22.0",
            token_expires_at: null,
          },
        }),
      }
    )

    if (!clearRes.ok) {
      return NextResponse.json(
        { error: "Falha ao limpar configuracoes" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
