import { auth } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8000"
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || ""

interface ProxyOptions {
  method?: string
  searchParams?: URLSearchParams
}

export async function adminProxy(
  backendPath: string,
  options: ProxyOptions = {}
) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role

  if (!session || role !== "superadmin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (!ADMIN_API_KEY) {
    return Response.json(
      { error: "Admin API key not configured" },
      { status: 503 }
    )
  }

  const queryString = options.searchParams?.toString()
  const url = `${BACKEND_URL}${backendPath}${queryString ? `?${queryString}` : ""}`

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: { "X-Admin-Key": ADMIN_API_KEY },
  })

  const data = await res.json()
  return Response.json(data, { status: res.status })
}
