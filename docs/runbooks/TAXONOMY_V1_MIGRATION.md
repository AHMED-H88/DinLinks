# Taxonomy v1 — Production Data Migration Runbook

## Authority

The sole authority for the taxonomy is
`docs/specifications/03_TAXONOMY_MASTER_LIST.md` (v1.1). This runbook only
describes how to apply it; it does not redefine it.

## What this migration does

- Creates the eight approved top-level Categories and all approved Subcategories.
- Sets the display name `Kafe` for slug `cafe` (slug unchanged).
- Reparents `restaurant` and `cafe` under `mat`, and `handverk` under `tjenester`.
- Reassigns the five test businesses to approved temporary Subcategories.
- Removes `annet` once it has no businesses and no children.
- Never renames an approved existing slug; never deletes users or the five test
  businesses.

## Prerequisites

- The Taxonomy Master List v1.1 is merged into `main`.
- The code implementation (this PR) is merged and deployed.
- You have direct database access (the direct connection, not the pooled one).

## Compatibility window (important)

The application code and the database migration must roll out **together** in one
controlled window. The new code expects the two-level hierarchy, so before the
data migration is applied:

- `BusinessForm` may present a top-level Category with **no selectable
  Subcategories** (the Subcategory rows do not exist yet).
- The Homepage shows only the **currently existing** top-level rows (e.g. `mat`
  and `bil` are absent until created), so it may show fewer shortcuts.
- Category pages, search filters and registration are **not considered fully
  operational**.

Do **not** leave the new code deployed against the old flat data for any
extended period. Deploy the reviewed commit and apply the migration in the same
controlled window.

## Coordinated rollout (exact order)

1. Create and verify a **PostgreSQL 17** `pg_dump` backup (outside the repo,
   owner-only, verified with `pg_restore --list`).
2. Confirm the latest **Supabase** scheduled backup and note its timestamp.
3. Run the **read-only preflight from the reviewed commit** (`npm run
   taxonomy:preflight`).
4. Review the preflight output — proceed only if section B (blocking problems) is
   empty and the five test businesses match.
5. Obtain **explicit founder approval**.
6. **Deploy the reviewed application commit.**
7. **Immediately apply** the taxonomy data migration during the controlled
   window (`taxonomy:migrate -- --apply` with both env confirmations).
8. **Validate** Homepage Categories, search filters, registration/edit flow,
   Category pages, and all five test profiles.
9. If validation fails, **roll back application and database together** (redeploy
   the previous app commit and restore the verified backup).

## Backup (required)

1. Create and verify a **PostgreSQL 17** `pg_dump` custom-format backup, stored
   outside the repository with owner-only permissions, and verify it with
   `pg_restore --list`.
2. Confirm the latest **Supabase** scheduled backup and note its timestamp.
3. Only after both are confirmed, set `TAXONOMY_BACKUP_CONFIRMED=YES`.

Never print or paste the database URL or any credentials.

## Read-only preflight

```bash
npm run taxonomy:preflight
```

Confirm:

- Expected current categories include `restaurant`, `cafe`, `handverk`, `annet`,
  `shopping`, `tjenester`, `helse`, `administrasjon` (flat, pre-migration).
- The five expected test businesses exist with their captured current
  categories:
  - Maaemo → restaurant
  - Elkjøp Ullevål → shopping
  - Cutters Storo → tjenester
  - TEST AS → helse
  - DAVIDOFF → annet
- No blocking integrity problems are reported.

If the data differs from the above, **stop** — do not guess.

## Apply (Production approval gate)

Production migration requires explicit founder approval. Only then:

```bash
TAXONOMY_BACKUP_CONFIRMED=YES \
TAXONOMY_MIGRATION_APPROVED=YES \
npm run taxonomy:migrate -- --apply
```

- Without `--apply`, the command is a dry run and writes nothing.
- With `--apply` but either confirmation missing, it aborts.
- It aborts if any of the five test businesses is missing or does not match the
  captured pre-migration state.

## Transaction behavior

All writes run inside a single database transaction. If post-migration
validation fails, the transaction rolls back automatically and no changes
persist.

## Validation checklist (enforced in-transaction)

- Exactly **59** Category rows: **8** top-level and **51** Subcategories.
- The final slug set exactly matches Taxonomy v1 (nothing extra, nothing missing).
- Every top-level Category has `parentId = null`; every Subcategory has its
  canonical top-level parent and canonical Norwegian display name.
- No category exists below the Subcategory level (no third level).
- No `annet` or `generelt` slug exists.
- **Every business** has a non-null `categoryId`, its Category exists, is an
  approved Subcategory, and its parent is a top-level Category — checked per row,
  so a null category relation cannot escape the check.
- No business is assigned directly to a top-level Category.
- Business row count is unchanged (only `categoryId` moved).

## Rollback

- Preferred: restore the verified backup.
- Alternative: a manual rollback restores the original business-to-category
  assignments, removes newly created Categories/Subcategories, restores the flat
  structure, and recreates `annet` only as part of restoring the captured
  pre-migration state. No slug is ever reused for a different meaning.

## Post-migration cache and ISR window

Caching is intentional (Performance P1) and is **not** removed. After the
database migration, cached pre-migration taxonomy data may remain temporarily
visible; this is **not** evidence of migration failure. Based on the current
code:

- `getTaxonomyTree` (`lib/cached-data.ts`) is wrapped in `unstable_cache` with
  `revalidate: CITY_TTL` = **900 seconds (15 minutes)**, tags
  `["categories","businesses"]`. Its cached tree may stay stale for up to
  **15 minutes**.
- The Homepage (`app/[locale]/page.tsx`) and Categories index
  (`app/[locale]/categories/page.tsx`) are ISR with `export const revalidate =
  300` = **5 minutes**.
- **Maximum expected wait ≈ 15 minutes** (the `getTaxonomyTree` TTL dominates;
  the ISR page then reflects it on its next ≤5-minute cycle).

To refresh sooner, use an already-supported mechanism only:

- **Wait** out the TTL above, or
- **Redeploy** the application (Vercel). A fresh deployment starts with an empty
  Next.js data cache and regenerates ISR, so the new taxonomy is reflected
  immediately.

Do not add an admin cache-clear endpoint and do not add unsafe cache-clearing
code.

## Post-migration validation

### A. Database validation — run IMMEDIATELY after the migration

- Exactly **59** taxonomy rows: **8** top-level + **51** Subcategories.
- No `annet` or `generelt`.
- All businesses on approved Subcategories (non-null `categoryId`, canonical
  top-level parent, none on a top-level).
- The five test mappings are correct (Maaemo→restaurant, Elkjøp Ullevål→
  elektronikk, Cutters Storo→frisor, TEST AS→fysioterapeut, DAVIDOFF→klaer).

(The in-transaction checks above already enforce these; re-confirm with a
read-only query if desired.)

### B. UI validation — run AFTER cache freshness is confirmed

Only after the cache/ISR window above has elapsed (or after a redeploy):

- Homepage shows top-level Categories only (six shortcuts + "Se alle kategorier").
- Categories index shows the eight top-level Categories with their Subcategories.
- Search filters show top-level Categories with Subcategories nested underneath.
- A top-level Category page lists its Subcategories and businesses across them; a
  Subcategory page lists its own businesses.
- Business registration/edit requires selecting a top-level Category then a
  Subcategory; only the Subcategory is stored.
- All five test profiles are present and correctly categorised.

Do not declare UI validation failed until cache/ISR freshness is confirmed
(waited out, or refreshed via a redeploy).

## Test profiles

The five test businesses are temporary development data. They remain available
during development and after this migration. Their deletion is a **separate**
controlled operation performed before the first real pilot businesses are
registered — it is not part of this taxonomy migration.
