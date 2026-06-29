"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    id: "what-is",
    question: "What is PitchKit?",
    answer:
      "A capstone portfolio project: a working web app for storing marketing and sales copy, tracking versions, and getting unstuck with short per-type writing notes. I built it for my own messy workflow, then polished it enough to ship.",
  },
  {
    id: "who-for",
    question: "Who is it for?",
    answer:
      "Mostly freelancers and solo builders who write their own pitches, bios, and outreach — and who are tired of maintaining the same sentences in five different places.",
  },
  {
    id: "versions",
    question: "How do versions work?",
    answer:
      "Each copy type (say, LinkedIn profile or positioning statement) can hold multiple versions. You pick one to edit, save drafts as you go, archive old ones, and see at a glance what's still in play.",
  },
  {
    id: "ai",
    question: "Does it write copy for you?",
    answer:
      "It can if you want. The built-in guides are plain prompts and checklists to simplify the writing process, but an AI is wired in and can be used simply for inspiration, advice or complete copy, if you need it.",
  },
] as const

export function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative border-b border-border/50 py-16 sm:py-20 md:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2
          id="faq-heading"
          className="text-center font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          A few notes
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground sm:text-lg">
          Context on what this is — and what it isn&apos;t.
        </p>
        <div className="mt-10 rounded-2xl border border-primary/10 bg-card/60 p-1 shadow-sm ring-1 ring-border/60 backdrop-blur-md sm:p-2">
          <Accordion multiple className="w-full px-2 sm:px-4">
            {faqs.map(({ id, question, answer }) => (
              <AccordionItem key={id} value={id}>
                <AccordionTrigger className="text-[15px] text-foreground hover:no-underline">
                  {question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="leading-relaxed text-muted-foreground">
                    {answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
