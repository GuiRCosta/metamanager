import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { RegisterForm } from "@/components/features/auth/register-form"

export default async function RegisterPage() {
  const session = await auth()

  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-page-bg">
      <RegisterForm />
    </div>
  )
}
