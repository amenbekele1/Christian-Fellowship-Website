# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Warsaw Ethiopian Christian Fellowship (WECF): a public church website plus a member portal, shipped as an installable PWA (members mostly use it on phones). Next.js 14 App Router, React 18, TypeScript (strict), Prisma 5 on PostgreSQL (hosted on Railway), NextAuth v4, Tailwind. Deployed on Vercel from `main`.

The repo folder name ends with a trailing space — always quote the path: `"/Users/amen/Downloads/Warsaw Ethiopian Christian Fellowship "`.

## Commands

```bash
npm run dev            # local dev server
npm run build          # prisma generate && next build (what Vercel runs)
npx tsc --noEmit       # typecheck — the main verification step; there is no test suite
npm run db:generate    # regenerate Prisma client after schema.prisma changes
npm run db:studio      # Prisma Studio
npm run db:seed        # tsx prisma/seed.ts
```

There are no tests and no ESLint config (`npm run lint` will prompt to create one). A stale `.next/dev/types` directory can produce a spurious `next/types.js` tsc error; it is not from source.

Test a cron endpoint locally: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/event-reminders`

## Database changes

The Vercel build only runs `prisma generate` — it never migrates. Schema changes are applied by hand:
1. Edit `prisma/schema.prisma`.
2. Write an **idempotent** raw SQL file under `prisma/migrations/<timestamp>_<name>/migration.sql` (use `IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object ...`) so it is safe to re-run. One-off data scripts go in `prisma/sql/`.
3. The SQL is run manually against production (Railway → Postgres → Query), before or alongside deploying code that depends on it.

Tables are snake_case via `@@map`; Prisma model names are PascalCase (note `BUSGroup` → `prisma.bUSGroup`).

## Architecture

### Route layout
- `src/app/(public)/` — public marketing site (home, about, events + `events/[slug]`, programs, visit, register, privacy). Editable copy comes from the `PageContent` table via `getPageContent(pageKey)` in `src/lib/page-content.ts`, edited at `/dashboard/admin/content`.
- `src/app/dashboard/` — authenticated portal. `dashboard/layout.tsx` mounts the PWA plumbing (push prompt, badge clearer, router refresher).
- `src/app/dashboard/admin/` — admin pages.
- `src/app/api/` — route handlers; all mutations go through these (no server actions).
- Empty leftover directories like `src/app/about`, `src/app/events` are not routes.

### Authorization (three layers — keep them consistent)
1. **`src/middleware.ts`** guards `/dashboard/*` (must be logged in). `/dashboard/admin/*` requires `GUARDIAN`, except members of the `LIBRARIAN` service team may reach `admin/books` and `WEBSITE_EDITOR` members may reach `admin/content|events|programs|announcements`. API routes for those features must mirror the same exception.
2. **JWT contents** (`src/lib/auth.ts`): `role`, `id`, `serviceTeams` (team `name`s) and `disabled` are re-read from the database every 2 minutes in the `jwt` callback; a deactivated/deleted user gets an empty session (treated as signed out). Sessions are 30 days with rotation deliberately disabled (`updateAge = maxAge`) for iOS/Android PWA cookie persistence — don't change this casually.
3. **Per-resource helpers** for nested API routes:
   - `groupAuth(groupId)` (`src/lib/group-auth.ts`) for `/api/bus-groups/[groupId]/*` — Guardian, group leader, or group member.
   - `teamAuth(teamId)` (`src/lib/team-auth.ts`) for `/api/teams/[teamId]/*` — Guardian, team leader, or team member.
   - Both return either a result object or a `NextResponse` error; check with `isAuthError` / `isTeamAuthError` and return early.
   - `verifyCron(req)` (`src/lib/cron-auth.ts`) for `/api/cron/*` — requires `CRON_SECRET` via `x-vercel-cron-secret` or `Authorization: Bearer`.

Roles: `MEMBER`, `BUS_LEADER`, `GUARDIAN`. Service teams (`ServiceTeam`, joined via `UserServiceTeam`) are orthogonal to role; `ServiceTeam.name` is a stable uppercase key (e.g. `LIBRARIAN`), `label` is display text.

### BUS groups and service teams share infrastructure
BUS groups (small groups) and service teams both get chat, files and video meetings. `GroupMessage` is polymorphic — exactly one of `busGroupId` / `teamId` is set (both nullable). UI is shared through `src/components/hub/` (`HubChat`, `HubFiles`, `HubMeeting`), used by both `dashboard/bus-groups/[groupId]/*` and `dashboard/teams/[teamId]/*`. When changing one side, check the other. Teams also have join-link invites (`TeamInviteToken`, public page `src/app/teams/join/[token]`).

Meetings use Jitsi as a Service: `meeting-token` routes sign an RS256 JWT with `jose` (`JAAS_*` env vars). `next.config.mjs` sets security headers globally and relaxes CSP `frame-src` for the meeting page.

### Push notifications and live refresh
- `src/lib/webpush.ts`: `sendPushToAll/User/Users/BusGroup` and `sendRefreshPush(topic)`. Dead subscriptions (404/410) are auto-deleted. No-ops gracefully if VAPID keys are missing.
- `public/sw.js`: payload `type: "refresh"` silently broadcasts `{type:"refresh", topic}` to open clients; otherwise shows a notification, bumps the app-icon badge and navigates to `data.url` on click.
- Client side: `usePushRefresh(topic, cb)` re-fetches on a matching broadcast; `useRefreshOnFocus` / `RouterRefresher` refresh on app focus; `<PullToRefresh>` wraps some pages. Admin mutation routes should call `sendRefreshPush("<topic>")` so open clients update.
- Crons are in `vercel.json` (Hobby plan: each runs at most daily). Event reminders therefore send a "Today" and a "Tomorrow" push from the 08:00 UTC run rather than an hour-before one.

### Bible and Bible study
- Scripture (`src/lib/bible.ts`, served to members via `/api/bible/text`): KJV from API.Bible (env `API_BIBLE_KEY`); NIV (id 111) and the Amharic NASV (id 1260) from YouVersion Platform (env `YOUVERSION_APP_KEY`, licences enabled in the YouVersion dashboard). YouVersion HTML is converted to the app's "[n]"-marked text by `youVersionHtmlToText`; whole chapters are fetched and verse ranges sliced locally (handles cross-chapter passages). The Amharic 1962 isn't licensed to apps, so it is a Bible.com link (`AMHARIC_VERSIONS`, `bibleComUrl` in client-safe `src/lib/bible-books.ts`). Protestant 66-book canon only. API.Bible displays must call FUMS `trackView` (done in `components/bible/ScriptureView.tsx`); cached text refreshes within 30 days; the copyright line is always shown.
- Studies: `StudySeries` → `StudySession` (passage range + `questions[]`), Guardian-only writes via `/api/bible-study`. Session `date` is a calendar day stored as UTC midnight of the Warsaw date. The daily cron sends a "read ahead" push the day before.

### Other conventions
- **Time zone:** the fellowship runs on Warsaw time but servers run in UTC. Use `src/lib/timezone.ts` for everything date-related: `parseWarsawDateTime` for values typed into forms (`datetime-local`/`date`), `toWarsawInputValue` to fill those inputs, `formatWarsaw`/`TIME_ZONE` (also used by the `formatDate*` helpers in `utils.ts`) for display, `warsawDateKey` for "which day is it". Never use bare `toLocale*`, `getHours()` or `getDate()`.
- **Popups:** use `toast.*` and `await confirmDialog({...})` from `src/components/ui/toaster.tsx`; never `alert()`/`confirm()`.
- **Rate limiting:** `await checkRateLimit(key, limit, windowMs)` from `src/lib/rate-limit.ts` (Postgres-backed, shared across instances).
- **Registration** requires a valid invite token server-side; invite links are multi-use until a Guardian disables them or they expire.
- Request validation with `zod` in route handlers; Prisma singleton from `@/lib/prisma`; `@/` maps to `src/`.
- Emails: `sendEmail` + HTML templates in `src/lib/email.ts` (Nodemailer SMTP). Escape any user-supplied text interpolated into HTML templates.
- File uploads go to Vercel Blob (`@vercel/blob`).
- Account deletion is a soft delete: PII is scrubbed, email becomes `deleted_<id>@wetcf.deleted`, `isActive=false`. Member listings must filter out inactive/deleted users.
- Event pages: themes/layouts and video-embed parsing live in `src/lib/event-presets.ts`; social links in `src/lib/social.ts`.
- Shared UI primitives (Button, Card, Badge, Input…) are in `src/components/ui/index.tsx`. Brand palette: Ethiopian-inspired forest green / gold / crimson, Playfair Display + Lato (see `tailwind.config.ts`).

`HANDOFF.md` (untracked) holds a security/performance punch list from an earlier session; some items have since been fixed — verify against the code before acting on it.
