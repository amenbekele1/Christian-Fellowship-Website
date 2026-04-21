-- Phase 2 push notifications: new tracking fields
ALTER TABLE "bus_groups" ADD COLUMN IF NOT EXISTS "lastMeetingPingAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "dayReminderSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "hourReminderSent" BOOLEAN NOT NULL DEFAULT false;
