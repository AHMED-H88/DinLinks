-- Corrective migration: restore the `businesses.status` column default so the
-- database matches the Prisma schema (`status BusinessStatus @default(PENDING)`)
-- and the original init migration.
--
-- Production had drifted to `DEFAULT 'APPROVED'` via an out-of-band change that
-- is not recorded in any migration. This resets the default to 'PENDING'.
--
-- Metadata-only change: it alters the column default only. It does NOT modify,
-- re-approve, or re-status any existing rows.
ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'PENDING';
