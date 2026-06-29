/**
 * Minimum viable freelance marketing stack — default copy types and
 * placeholder guides for new versions.
 */

export type MarketingStackType = {
  name: string;
  sortOrder: number;
  guide: string;
};

export const MARKETING_STACK_TYPES: MarketingStackType[] = [
  {
    name: "Clear Positioning Statement",
    sortOrder: 0,
    guide: `The single most important thing.

Answer:
• What you do
• Who you help
• What result you create

Everything else derives from this.

Example:
"I help small businesses simplify their operations through custom automation systems."`,
  },
  {
    name: "LinkedIn Profile",
    sortOrder: 1,
    guide: `Not "personal branding." Just a clear professional presence.

Minimum:
• Strong headline
• Concise About section
• Profile photo
• Examples / results
• Contact info

For many freelancers, LinkedIn alone is enough early on.`,
  },
  {
    name: "Simple Website (1–3 Pages Max)",
    sortOrder: 2,
    guide: `No elaborate branding required.

Just:
• Homepage
• Services
• Contact

Optional:
• One case study page

The goal is legitimacy and clarity, not design awards.`,
  },
  {
    name: "Service Descriptions",
    sortOrder: 3,
    guide: `Short explanations of:
• What you offer
• Who it's for
• Expected outcome
• Approximate process

Clients need clarity more than creativity.`,
  },
  {
    name: "Portfolio or Proof",
    sortOrder: 4,
    guide: `One of:
• Case studies
• Screenshots
• Testimonials
• Sample projects
• Before/after examples
• Measurable results

People trust evidence.`,
  },
  {
    name: "Outreach Message Template",
    sortOrder: 5,
    guide: `A reusable email/DM framework for:
• Introductions
• Referrals
• Follow-ups
• Reconnecting

This matters more than posting daily content.`,
  },
  {
    name: "Basic Content System",
    sortOrder: 6,
    guide: `Minimal effort version:
• One useful LinkedIn post weekly
• One insight, lesson, observation, or client problem

Consistency beats volume.`,
  },
  {
    name: "Call to Action",
    sortOrder: 7,
    guide: `A clear next step everywhere:
• Book a call
• Send an email
• Request a quote
• Ask a question

Most freelancers hide the next step unintentionally.`,
  },
];

const guideByName = new Map(
  MARKETING_STACK_TYPES.map((t) => [t.name, t.guide])
);

/** Strips legacy "1. " prefixes so guides still match renamed types. */
export function normalizeTypeName(typeName: string): string {
  return typeName.replace(/^\d+\.\s+/, "");
}

/** Placeholder body for a new version; empty for custom types. */
export function getGuideForTypeName(typeName: string): string {
  return guideByName.get(normalizeTypeName(typeName)) ?? "";
}

export function resolveVersionContent(
  _typeName: string,
  content: string | undefined
): string {
  return typeof content === "string" ? content.trim() : "";
}

/** True when stored content is the old auto-inserted guide placeholder. */
export function isVersionGuideContent(
  typeName: string,
  content: string
): boolean {
  const guide = getGuideForTypeName(typeName);
  if (!guide) return false;
  return content.trim() === guide.trim();
}
