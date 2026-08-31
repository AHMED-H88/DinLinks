-- Public URL identity for businesses.
--
-- Strictly additive: one new nullable column, a deterministic backfill for
-- real rows, and a unique index. Nothing is dropped, renamed or retyped, and
-- no existing data column is modified, so the previous application version
-- keeps running against this schema unchanged (it never selects the column).
--
-- shortId is the immutable key the public business URL resolves from:
-- /{locale}/business/{name-derived-slug}-{shortId}. The readable slug is
-- derived from the current name at render time and never stored.
--
-- Backfill notes:
-- - substr(md5(id), 1, 10) is 10 lowercase hex characters — a subset of the
--   approved [a-z0-9] alphabet — derived from the immutable primary key. The
--   "shortId" IS NULL guard makes the statement safe to re-execute as a
--   repair (a row created by a not-yet-deployed old app version after this
--   migration ran would otherwise keep NULL forever) without ever touching a
--   row that already has a shortId, including crypto-generated ones.
-- - Demo rows are skipped (isDemo = true keeps shortId NULL): their
--   /business/<id> outreach URLs must never change, and the profile route
--   never redirects a demo.
-- - The unique index is created AFTER the backfill: a collision (~16^-10
--   scale) would fail the migration visibly instead of corrupting silently.
--   Postgres unique indexes ignore NULLs, so the demo rows cannot conflict.
--
-- Atomicity: the explicit BEGIN/COMMIT below is what guarantees all three
-- statements apply or none do. Verified empirically against this project's
-- exact toolchain (Prisma CLI 5.22.0, PostgreSQL 14): the CLI accepts
-- explicit transaction blocks in migration files, and an induced
-- mid-migration failure rolls back the column, the backfill and the index
-- together. Prisma 5.22 happened to apply the whole script atomically even
-- without the block, but that is CLI implementation detail; the explicit
-- transaction makes atomicity a property of this file, independent of the
-- CLI version that runs it. All three statements are transaction-safe (the
-- index is NOT built CONCURRENTLY, which would be incompatible - unneeded at
-- this table's row counts). On failure Prisma marks the migration failed;
-- recover with `prisma migrate resolve --rolled-back <name>` and redeploy.
--
-- New rows get a crypto-random [a-z0-9]{10} shortId at creation
-- (lib/shortid.ts), with a retry on the unique constraint.

BEGIN;

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "shortId" TEXT;

-- Backfill real businesses deterministically from their immutable id.
UPDATE "businesses" SET "shortId" = substr(md5(id), 1, 10) WHERE "isDemo" = false AND "shortId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "businesses_shortId_key" ON "businesses"("shortId");

COMMIT;
