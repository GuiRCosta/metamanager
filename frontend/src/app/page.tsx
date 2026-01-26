import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // If authenticated, show the dashboard (handled by (dashboard)/page.tsx)
  // We need to use a different approach - redirect to dashboard route
  redirect("/dashboard")
}
