-- ============================================================
-- Bible study: series (e.g. "Acts") and weekly sessions with a
-- passage and questions. Idempotent; safe to re-run.
-- Run in Railway -> Postgres -> Query BEFORE deploying the code.
-- ============================================================

CREATE TABLE IF NOT EXISTS "study_series" (
  "id"          TEXT         NOT NULL,
  "title"       TEXT         NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "study_series_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "study_sessions" (
  "id"           TEXT         NOT NULL,
  "seriesId"     TEXT         NOT NULL,
  "date"         TIMESTAMP(3) NOT NULL,
  "title"        TEXT,
  "bookId"       TEXT         NOT NULL,
  "startChapter" INTEGER      NOT NULL,
  "startVerse"   INTEGER,
  "endChapter"   INTEGER,
  "endVerse"     INTEGER,
  "questions"    TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes"        TEXT,
  "reminderSent" BOOLEAN      NOT NULL DEFAULT false,
  "createdById"  TEXT         NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "study_sessions"
    ADD CONSTRAINT "study_sessions_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "study_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "study_sessions_date_idx"          ON "study_sessions" ("date");
CREATE INDEX IF NOT EXISTS "study_sessions_seriesId_date_idx" ON "study_sessions" ("seriesId", "date");
