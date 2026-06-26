"use client"

import * as React from "react"
import Link from "next/link"
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs"
import { MenuIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const DASHBOARD_HREF = "/dashboard" as const

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
] as const

function AuthActions({ className }: { className?: string }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button variant="outline" size="sm" disabled className="min-w-20">
          …
        </Button>
      </div>
    )
  }

  if (isSignedIn) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Link
          href={DASHBOARD_HREF}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" })
          )}
        >
          Dashboard
        </Link>
        <UserButton
          appearance={{
            elements: { avatarBox: "size-8 rounded-none" },
          }}
        />
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SignInButton mode="modal" forceRedirectUrl={DASHBOARD_HREF}>
        <Button variant="outline" size="sm" className="bg-background/50 text-foreground hover:bg-accent/35">
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl={DASHBOARD_HREF}>
        <Button size="sm" className="shadow-md shadow-primary/15">
          Get started
        </Button>
      </SignUpButton>
    </div>
  )
}

export function Navbar({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  const [hidden, setHidden] = React.useState(false)
  const [prefersReducedMotion] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const lastY = React.useRef(0)

  React.useEffect(() => {
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
        !prefersReducedMotion && hidden && "-translate-y-full",
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

        <AuthActions className="hidden md:flex" />

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
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <MobileAuth onClose={() => setOpen(false)} />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function MobileAuth({ onClose }: { onClose: () => void }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (isSignedIn) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href={DASHBOARD_HREF}
          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
          onClick={() => onClose()}
        >
          Dashboard
        </Link>
        <div className="flex justify-start">
          <UserButton
            appearance={{
              elements: { avatarBox: "size-9 rounded-none" },
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <SignInButton mode="modal" forceRedirectUrl={DASHBOARD_HREF}>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onClose()}
        >
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl={DASHBOARD_HREF}>
        <Button className="w-full shadow-md shadow-primary/15" onClick={() => onClose()}>
          Get started
        </Button>
      </SignUpButton>
    </div>
  )
}
