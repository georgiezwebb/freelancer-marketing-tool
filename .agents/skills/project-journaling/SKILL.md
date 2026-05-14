---
name: project-journaling
description: >-
  Maintains the project development journal: logs completed work, bug fixes,
  features, and architectural decisions in Markdown. Use when the user asks
  to log progress, update a changelog, record decisions, journal the session,
  or add an entry to the project log.
metadata:
  skillport:
    category: Productivity
    tags: [journaling, docs, tracking]
---

# Project journaling

## When to apply

Use this skill whenever the user wants to record what happened in a session or sprint: progress logs, changelog updates, ADRs (brief form), or retrospective notes.

## Workflow

1. **Timestamp** — Use the current date and time in the entry heading (respect the workspace or user-provided “today” when authoritative). Prefer ISO-8601 in the heading, e.g. `2026-05-14`, and local time in the body if useful.

2. **Read existing log** — Open `.cursor/docs/JOURNAL.md` from the project root (create the file and folder if missing). Scan recent entries so you do not duplicate or contradict prior decisions.

3. **Summarize this session** — Capture only what matters:
   - Features added or changed
   - Bug fixes and root causes (short)
   - Dependency or config changes worth remembering
   - Architectural or product decisions (why, not essay length)

4. **Write to the journal** — Insert a **new block at the top of the file** immediately under the main `#` title (newest-first). Keep each entry self-contained. Use the template below.

5. **Tone** — Factual, concise, readable in under a minute. No fluff. Link paths or PRs when the user provides them.

## Entry template

Paste a new instance at the **top** after the file title (adjust heading level if the file uses a different top-level structure):

```markdown
## YYYY-MM-DD (optional: brief label)

**Time / context:** optional local time or session note.

- **Changes:** bullet list of concrete edits or outcomes
- **Fixes:** bullet list (or “none”)
- **Decisions:** bullet list of ADR-style notes (or “none”)
- **Follow-ups:** optional; only if the user explicitly wants them recorded
```

If the file is empty except for the title, the first `##` entry starts the history.

## File location

- Primary log: `.cursor/docs/JOURNAL.md`
- If the user names a different path, use theirs and mention the standard path for future consistency.
