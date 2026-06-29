import Link from "next/link"

import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[min(88dvh,56rem)] flex-col justify-center overflow-hidden border-b border-border/50"
    >
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "var(--hero-blob-a)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[24rem] w-[24rem] rounded-full blur-3xl"
        style={{ background: "var(--hero-blob-b)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[20rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-[40%] blur-3xl"
        style={{ background: "var(--hero-blob-c)" }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-24 md:py-28">
        <p className="motion-safe:fade-up mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
          Portfolio project
        </p>
        <h1
          id="hero-heading"
          className="motion-safe:fade-up motion-safe:fade-up-delay-1 max-w-4xl font-heading font-semibold tracking-tight text-foreground"
          style={{
            fontSize: "clamp(2rem, 5vw + 1rem, 3.75rem)",
            lineHeight: 1.08,
          }}
        >
          <span className="text-gradient-hero">A place for marketing text.</span>
        </h1>
        <p className="motion-safe:fade-up motion-safe:fade-up-delay-2 mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          This app is an easy way to store and manage sales and marketing copy. It groups by type, offers a few prompts when you&apos;re
          stuck, and keeps versions so you can see what you're currently using.
        </p>
        <div className="motion-safe:fade-up motion-safe:fade-up-delay-3 mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-12 sm:w-auto sm:flex-row sm:items-center">
          <Button
            size="lg"
            className="min-h-10 px-7 shadow-lg shadow-primary/20"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Try the dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="min-h-10 bg-background/65 px-7 backdrop-blur-sm hover:bg-accent/45"
            nativeButton={false}
            render={<Link href="#features" />}
          >
            What it does
          </Button>
        </div>
      </div>
    </section>
  )
}
