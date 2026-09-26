-- ============================================================
-- Service teams get leaders, chat and invite links.
-- Events get rich content. New feedback system.
-- Every statement is idempotent so this is safe to re-run.
-- ============================================================

-- ── Feedback status enum ────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FIXED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Team leaders ────────────────────────────────────────────
ALTER TABLE "service_teams" ADD COLUMN IF NOT EXISTS "leaderId" TEXT;

DO $$ BEGIN
  ALTER TABLE "service_teams"
    ADD CONSTRAINT "service_teams_leaderId_fkey"
    FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Group messages now serve BUS groups AND teams ───────────
-- busGroupId becomes nullable; existing rows keep their value.
ALTER TABLE "group_messages" ALTER COLUMN "busGroupId" DROP NOT NULL;
ALTER TABLE "group_messages" ADD COLUMN IF NOT EXISTS "teamId" TEXT;

DO $$ BEGIN
  ALTER TABLE "group_messages"
    ADD CONSTRAINT "group_messages_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "service_teams"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "group_messages_teamId_seq_idx"
  ON "group_messages" ("teamId", "seq");

-- ── Team invite links ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "team_invite_tokens" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "token"       TEXT NOT NULL UNIQUE,
  "teamId"      TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "useCount"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_invite_tokens_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "service_teams"("id") ON DELETE CASCADE,
  CONSTRAINT "team_invite_tokens_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "team_invite_tokens_teamId_idx"
  ON "team_invite_tokens" ("teamId");

-- ── Feedback ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "feedback" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "userId"     TEXT NOT NULL,
  "category"   TEXT,
  "message"    TEXT NOT NULL,
  "pageUrl"    TEXT,
  "status"     "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
  "adminNote"  TEXT,
  "notified"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "feedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "feedback_status_createdAt_idx"
  ON "feedback" ("status", "createdAt");

-- ── Rich events ─────────────────────────────────────────────
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "body"     TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "theme"    TEXT DEFAULT 'brown';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "layout"   TEXT DEFAULT 'banner';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "gallery"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
