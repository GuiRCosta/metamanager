"use client"

import { AdAccountProvider } from "@/contexts/ad-account-context"

export function AdAccountProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdAccountProvider>{children}</AdAccountProvider>
}
