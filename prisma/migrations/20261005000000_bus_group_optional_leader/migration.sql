-- ============================================================
-- BUS groups may be created without a leader.
-- Idempotent; safe to re-run. Run in Railway -> Postgres -> Query
-- BEFORE (or right after) deploying the matching code.
-- ============================================================

ALTER TABLE "bus_groups" ALTER COLUMN "leaderId" DROP NOT NULL;

-- If a leader's account is removed, the group stays and becomes leaderless.
ALTER TABLE "bus_groups" DROP CONSTRAINT IF EXISTS "bus_groups_leaderId_fkey";
ALTER TABLE "bus_groups"
  ADD CONSTRAINT "bus_groups_leaderId_fkey"
  FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
