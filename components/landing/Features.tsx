import {
  CalendarDaysIcon,
  FolderKanbanIcon,
  MessagesSquareIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const items = [
  {
    icon: FolderKanbanIcon,
    title: "Copy library",
    accent: "from-primary/25 via-primary/10 to-accent/35",
    description:
      "Save taglines, case-study blurbs, and service descriptions with labels so you can reuse the right message for each channel.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Simple marketing plan",
    accent: "from-chart-2/30 via-primary/10 to-muted",
    description:
      "Outline what to post, send, or pitch each week, without a spreadsheet degree. Adjust as client work shifts.",
  },
  {
    icon: MessagesSquareIcon,
    title: "Channel-ready snippets",
    accent: "from-accent/40 via-primary/15 to-secondary",
    description:
      "Keep LinkedIn hooks, email intros, and portfolio blurbs in sync so your voice stays consistent everywhere.",
  },
] as const

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative border-b border-border/50 bg-gradient-to-b from-muted/50 via-background to-muted/30 py-16 sm:py-20 md:py-24"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="features-heading"
            className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.5rem] md:leading-tight"
          >
            Everything you need to sound clear, not busy
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            One workspace for the words you repeat and the plan that keeps your
            marketing moving.
          </p>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, description, accent }) => (
            <li key={title}>
              <Card
                className={cn(
                  "motion-safe:hover-lift h-full border-border/70 bg-card/80 shadow-sm ring-1 ring-primary/5 backdrop-blur-sm"
                )}
              >
                <CardHeader className="pb-2">
                  <div
                    className={cn(
                      "mb-3 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-primary shadow-inner ring-1 ring-primary/10",
                      accent
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-pretty leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
