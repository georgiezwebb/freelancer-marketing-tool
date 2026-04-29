import Link from "next/link"

import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-muted/60 via-muted/40 to-background py-12 sm:py-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Pitch<span className="text-gradient-hero">Kit</span>
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Marketing copy and planning for independent professionals.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-8 gap-y-2 text-sm"
            aria-label="Footer"
          >
            <Link
              href="#features"
              className="font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Features
            </Link>
            <Link
              href="#faq"
              className="font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              FAQ
            </Link>
            <Link
              href="#hero"
              className="font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Back to top
            </Link>
          </nav>
        </div>
        <Separator className="my-8 bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PitchKit. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
