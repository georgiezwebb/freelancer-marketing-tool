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
      "PitchKit is a lightweight tool for freelancers to store reusable marketing copy and sketch a simple weekly or monthly marketing plan, so you spend less time rewriting and more time on client work.",
  },
  {
    id: "who-for",
    question: "Who is it for?",
    answer:
      "Solo freelancers and small studios who juggle their own marketing alongside billable work: designers, developers, writers, and consultants who want one place for their go-to messaging.",
  },
  {
    id: "copy-vs-plan",
    question: "How do copy storage and the plan work together?",
    answer:
      "Your library is the source of truth for snippets and blurbs. The plan layer helps you decide when and where to use them, without losing them in Notion pages or random docs.",
  },
  {
    id: "pricing",
    question: "Is there a free tier?",
    answer:
      "We’re focusing on the landing experience first. Pricing and accounts will follow. Check back soon or join the waitlist when we open sign-ups.",
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
          Frequently asked questions
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground sm:text-lg">
          Quick answers about the product direction. More detail will land as the
          app grows.
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
