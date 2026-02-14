import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userRole = (session.user as { role?: string })?.role

  if (userRole === "superadmin") {
    redirect("/monitoring")
  }

  redirect("/dashboard")
}
