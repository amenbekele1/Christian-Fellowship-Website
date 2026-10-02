-- ============================================================
-- Phase 2 – New tables: service_teams, group_messages,
--   group_tasks, push_subscriptions, page_contents
--   Plus phase-2 columns on existing tables.
-- Run this in Railway → Query tab if you haven't already.
-- Safe to run multiple times (all statements use IF NOT EXISTS).
-- ============================================================

-- 0. TaskStatus enum (needed by group_tasks)
DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. service_teams
CREATE TABLE IF NOT EXISTS "service_teams" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "label"       TEXT NOT NULL,
    "description" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_teams_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "service_teams_name_key" ON "service_teams"("name");

-- 2. user_service_teams
CREATE TABLE IF NOT EXISTS "user_service_teams" (
    "userId"     TEXT NOT NULL,
    "teamId"     TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_service_teams_pkey" PRIMARY KEY ("userId","teamId")
);
ALTER TABLE "user_service_teams"
    ADD CONSTRAINT "user_service_teams_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "user_service_teams"
    ADD CONSTRAINT "user_service_teams_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "service_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT DEFERRABLE INITIALLY IMMEDIATE;

-- 3. group_messages
CREATE TABLE IF NOT EXISTS "group_messages" (
    "id"             TEXT NOT NULL,
    "seq"            BIGSERIAL,
    "busGroupId"     TEXT NOT NULL,
    "senderId"       TEXT NOT NULL,
    "content"        TEXT,
    "fileUrl"        TEXT,
    "fileName"       TEXT,
    "fileType"       TEXT,
    "isAnnouncement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "group_messages_busGroupId_seq_idx"
    ON "group_messages"("busGroupId","seq");
ALTER TABLE "group_messages"
    ADD CONSTRAINT "group_messages_busGroupId_fkey"
    FOREIGN KEY ("busGroupId") REFERENCES "bus_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "group_messages"
    ADD CONSTRAINT "group_messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT DEFERRABLE INITIALLY IMMEDIATE;

-- 4. group_tasks
CREATE TABLE IF NOT EXISTS "group_tasks" (
    "id"           TEXT NOT NULL,
    "busGroupId"   TEXT NOT NULL,
    "createdById"  TEXT NOT NULL,
    "assignedToId" TEXT,
    "title"        TEXT NOT NULL,
    "description"  TEXT,
    "status"       "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate"      TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "group_tasks_busGroupId_idx"
    ON "group_tasks"("busGroupId");
ALTER TABLE "group_tasks"
    ADD CONSTRAINT "group_tasks_busGroupId_fkey"
    FOREIGN KEY ("busGroupId") REFERENCES "bus_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "group_tasks"
    ADD CONSTRAINT "group_tasks_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "group_tasks"
    ADD CONSTRAINT "group_tasks_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
    NOT DEFERRABLE INITIALLY IMMEDIATE;

-- 5. push_subscriptions
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "endpoint"  TEXT NOT NULL,
    "p256dh"    TEXT NOT NULL,
    "auth"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key"
    ON "push_subscriptions"("endpoint");
ALTER TABLE "push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT DEFERRABLE INITIALLY IMMEDIATE;

-- 6. page_contents
CREATE TABLE IF NOT EXISTS "page_contents" (
    "id"        TEXT NOT NULL,
    "pageKey"   TEXT NOT NULL,
    "fieldKey"  TEXT NOT NULL,
    "label"     TEXT NOT NULL,
    "value"     TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_contents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "page_contents_pageKey_fieldKey_key"
    ON "page_contents"("pageKey","fieldKey");

-- 7. New columns on existing tables (phase 2 push)
ALTER TABLE "bus_groups"
    ADD COLUMN IF NOT EXISTS "lastMeetingPingAt" TIMESTAMP(3);

ALTER TABLE "events"
    ADD COLUMN IF NOT EXISTS "dayReminderSent"  BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "hourReminderSent" BOOLEAN NOT NULL DEFAULT false;

-- Done!
