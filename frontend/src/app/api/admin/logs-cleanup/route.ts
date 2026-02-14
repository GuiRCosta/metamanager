import { type NextRequest } from "next/server"
import { adminProxy } from "@/lib/backend-proxy"

export async function DELETE(request: NextRequest) {
  const params = new URLSearchParams()
  const days = request.nextUrl.searchParams.get("days")
  if (days) params.set("days", days)

  return adminProxy("/api/admin/logs-cleanup", {
    method: "DELETE",
    searchParams: params,
  })
}
