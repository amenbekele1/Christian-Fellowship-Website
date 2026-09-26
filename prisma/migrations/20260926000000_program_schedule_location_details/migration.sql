-- Add structured fields to Program so schedule/location/steps are no longer
-- crammed into the title and description.
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "schedule" TEXT;
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "details" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
