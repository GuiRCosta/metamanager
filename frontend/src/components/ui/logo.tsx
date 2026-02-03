"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Image from "next/image"

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export function Logo({ width = 100, height = 26, className }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        style={{ width, height }}
        className={className}
        aria-hidden="true"
      />
    )
  }

  const logoSrc = resolvedTheme === "dark"
    ? "/logo-light.png"
    : "/logo-dark.png"

  return (
    <Image
      src={logoSrc}
      alt="iDEVA"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}
