-- Outreach demo profiles.
--
-- Strictly additive: one new column, NOT NULL with a DEFAULT, so every existing
-- row becomes isDemo = false without a backfill and the previous application
-- version keeps running against this schema unchanged.
--
-- isDemo is the authoritative flag for "this Business is a DinLinks example
-- profile, not a real company". It is written only by the seed; neither the
-- business editor nor the public business API sets it, so a business created
-- by a real owner is always false.
--
-- No index is added. Every discovery query already filters on `status`, which
-- is indexed, and the demo rows are a fixed handful — an index on a column
-- whose value is false for effectively every row would not be used.

-- AlterTable
ALTER TABLE "businesses"
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;
