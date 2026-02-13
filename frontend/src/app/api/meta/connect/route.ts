import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
const FACEBOOK_CONFIG_ID = process.env.FACEBOOK_CONFIG_ID

function getRedirectUri() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  return `${baseUrl}/api/auth/callback/facebook`
}

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const session = await auth()
  if (!session) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  if (!FACEBOOK_APP_ID || !FACEBOOK_CONFIG_ID) {
    return NextResponse.redirect(
      new URL("/settings?meta_error=missing_config", baseUrl)
    )
  }

  const state = crypto.randomUUID()

  const cookieStore = await cookies()
  cookieStore.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    config_id: FACEBOOK_CONFIG_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    state,
  })

  const facebookUrl = `https://www.facebook.com/dialog/oauth?${params.toString()}`

  return NextResponse.redirect(facebookUrl)
}
