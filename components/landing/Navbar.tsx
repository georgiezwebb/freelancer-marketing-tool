"use client"

import * as React from "react"
import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
] as const

export function Navbar({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  const [hidden, setHidden] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(true)
  const lastY = React.useRef(0)

  React.useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
    lastY.current = window.scrollY

    const onScroll = () => {
      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return
      }
      const y = window.scrollY
      if (y < 32) {
        setHidden(false)
        lastY.current = y
        return
      }
      if (y > lastY.current && y > 100) setHidden(true)
      else if (y < lastY.current) setHidden(false)
      lastY.current = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl backdrop-saturate-150",
        "motion-safe:transition-nav",
        !reduceMotion && hidden && "-translate-y-full",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          Pitch<span className="text-gradient-hero">Kit</span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <Button
              key={href}
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={href} />}
              className="text-muted-foreground hover:text-foreground"
            >
              {label}
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="#hero" />}
            className="bg-background/50 text-foreground hover:bg-accent/35"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="#hero" />}
            className="shadow-md shadow-primary/15"
          >
            Get started
          </Button>
        </div>

        <div className="flex items-center md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Open menu" />
              }
            >
              <MenuIcon className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw,20rem)]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2" aria-label="Mobile">
                {navLinks.map(({ href, label }) => (
                  <Button
                    key={href}
                    variant="ghost"
                    className="justify-start"
                    nativeButton={false}
                    render={<Link href={href} />}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Button>
                ))}
                <Button
                  className="mt-4 w-full shadow-md shadow-primary/15"
                  nativeButton={false}
                  render={<Link href="#hero" />}
                  onClick={() => setOpen(false)}
                >
                  Get started
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
