import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function CalculatorShell({
  eyebrow,
  title,
  description,
  children,
  aside,
  className,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <main className={cn("bg-background", className)}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Arsenal do Corredor
        </Link>

        <header className="mt-8 max-w-3xl">
          <div className="text-sm font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground text-pretty">
            {description}
          </p>
        </header>

        <div
          className={cn(
            "mt-8 grid items-start gap-6",
            aside ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "",
          )}
        >
          <div>{children}</div>
          {aside && <aside className="lg:sticky lg:top-24">{aside}</aside>}
        </div>
      </div>
    </main>
  )
}
