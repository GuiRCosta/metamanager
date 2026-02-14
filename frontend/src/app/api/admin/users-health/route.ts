import { type NextRequest } from "next/server"
import { adminProxy } from "@/lib/backend-proxy"

export async function GET(request: NextRequest) {
  const params = new URLSearchParams()
  const hours = request.nextUrl.searchParams.get("hours")
  if (hours) params.set("hours", hours)

  return adminProxy("/api/admin/users-health", { searchParams: params })
}
