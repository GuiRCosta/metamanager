import { type NextRequest } from "next/server"
import { adminProxy } from "@/lib/backend-proxy"

export async function GET(request: NextRequest) {
  const params = new URLSearchParams(request.nextUrl.searchParams)
  return adminProxy("/api/logs", { searchParams: params })
}
