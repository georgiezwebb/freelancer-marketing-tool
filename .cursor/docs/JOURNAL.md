# Project journal

Entries below are **newest first**. Each session log is a `##` section with bullets for changes, fixes, and decisions.

## 2026-05-19 — Copy library dashboard, auth, and schema

**Time / context:** Capstone build-out through landing page, Clerk auth, Prisma/Postgres, and dashboard UX.

- **Changes:**
  - **Data model:** Replaced flat `Copy` with `CopyType` (user-defined categories) and `CopyVersion` (title, content, dates). New users get default types **Type 1**, **Type 2**, **Type 3** via `lib/copy-types.ts`.
  - **API:** `GET/POST /api/copy-types`, `PATCH/DELETE /api/copy-types/[id]`, `POST /api/copy-types/[id]/versions`, `PATCH/DELETE /api/copy-versions/[id]`. Removed legacy `/api/copy` routes.
  - **Dashboard:** `/dashboard` with left sidebar (types → nested versions) and center `CopyEditor` (save/delete, dates). Components: `DashboardSidebar`, `CopyEditor`, `DashboardClient`.
  - **Auth:** Clerk in `proxy.ts` (protect `/dashboard` and copy APIs). Post–sign-in/sign-up redirect to `/dashboard` via `ClerkProvider` props, `SignedInDashboardRedirect`, and navbar `forceRedirectUrl` on sign-in/up buttons.
  - **Prisma 7:** `DATABASE_URL` in `prisma.config.ts`; `PrismaClient` + `@prisma/adapter-pg` in `lib/db.ts`. Scripts: `db:generate`, `db:push`, `db:migrate`.
  - **Dev tooling:** `next dev --webpack` (Turbopack dev hang on first compile). `next.config.mjs` sets `turbopack.root` to app dir.
  - **Skills:** `project-journaling` skill; `caveman` skill added from GitHub (SSH install pattern documented).
- **Fixes:**
  - Tailwind/CSS resolve errors when parent `~/Projects/package.json` stole module context — `turbopack.root` and webpack dev workaround.
  - Next.js route error: dynamic segment must be consistent — renamed `[typeId]` to `[id]` under `copy-types/` for versions route.
  - Prisma CLI/client mismatch — aligned `prisma@7.8.0` with `@prisma/client@7.8.0` and regenerated client to `app/generated/prisma`.
- **Decisions:**
  - **Type → many versions** keeps the mental model simple: types are folders, versions are posts/variants under them.
  - Sidebar shows versions as **indented sub-items** under each type (expand/collapse, per-type **+**).
  - Clerk users synced to Prisma `User` by email on first API/dashboard access (`lib/app-user.ts`).
- **Follow-ups:**
  - Run `npm run db:push` (or migrate) if tables are not yet applied.
  - Optional: inline rename for copy types; suggested titles when types are created; Clerk redirect env vars in `.env` if modal redirect misbehaves.

## 2026-05-14 — Project journaling skill

- **Changes:** Added `.agents/skills/project-journaling/SKILL.md` (Cursor skill for session logs, changelog-style notes, and short ADRs). Seeded `.cursor/docs/JOURNAL.md`.
- **Fixes:** none
- **Decisions:** Journal file lives at `.cursor/docs/JOURNAL.md`; skills stay under `.agents/skills/` to match this repo.
