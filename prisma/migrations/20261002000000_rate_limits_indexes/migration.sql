-- ============================================================
-- Shared rate limiting table and indexes for common queries.
-- Every statement is idempotent so this is safe to re-run.
--
-- Run in Railway -> Postgres -> Query. The app keeps working before
-- this runs (rate limiting falls back to per-instance memory).
-- ============================================================

-- ── Rate limits ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "rate_limits" (
  "key"     TEXT         NOT NULL,
  "count"   INTEGER      NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "rate_limits_resetAt_idx" ON "rate_limits" ("resetAt");

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "book_rentals_status_dueDate_idx" ON "book_rentals" ("status", "dueDate");
CREATE INDEX IF NOT EXISTS "book_rentals_userId_status_idx"  ON "book_rentals" ("userId", "status");
CREATE INDEX IF NOT EXISTS "events_isActive_startDate_idx"   ON "events" ("isActive", "startDate");
CREATE INDEX IF NOT EXISTS "push_subscriptions_userId_idx"   ON "push_subscriptions" ("userId");
CREATE INDEX IF NOT EXISTS "announcements_expiresAt_idx"     ON "announcements" ("expiresAt");
