import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8000"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { message, ad_account_id, context } = body

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem é obrigatória" },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/api/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        ad_account_id,
        context: {
          ...context,
          user_id: session.user?.id,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || "Erro ao processar mensagem" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
