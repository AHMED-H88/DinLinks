/**
 * taxonomy:migrate — controlled Taxonomy v1 DATA migration.
 *
 * SAFETY BY DEFAULT:
 *   - Without `--apply` it only prints the plan and refuses to write.
 *   - With `--apply` it ALSO requires both environment confirmations:
 *         TAXONOMY_BACKUP_CONFIRMED=YES
 *         TAXONOMY_MIGRATION_APPROVED=YES
 *   - It aborts on unexpected Production data and runs inside one transaction,
 *     rolling back automatically if post-migration validation fails.
 *
 * It never deletes users/auth records and never deletes the five test
 * businesses — it only moves their categoryId to approved temporary
 * Subcategories. Run via tsx. Do NOT run against Production during
 * implementation.
 */
import { PrismaClient } from "@prisma/client";
import {
  TOP_LEVELS,
  SUBCATEGORIES,
  TEST_BUSINESS_ASSIGNMENTS,
  parentSlugOf,
} from "../lib/taxonomy-v1";

const EXPECTED_TEST_BUSINESSES = TEST_BUSINESS_ASSIGNMENTS;

/** Slugs allowed to exist BEFORE the migration: every approved slug, plus
 *  `annet` as the known temporary legacy row. `generelt` is never allowed. */
const ALLOWED_PRE_MIGRATION_SLUGS = new Set([
  ...TOP_LEVELS.map((t) => t.slug),
  ...SUBCATEGORIES.map((s) => s.slug),
  "annet",
]);

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");

function abort(message) {
  console.error(`MIGRATION ABORTED — ${message}`);
  process.exit(1);
}

async function main() {
  if (!APPLY) {
    console.log("taxonomy:migrate — refusing to write (no --apply).");
    console.log("This is a dry run. Run `npm run taxonomy:preflight` to inspect current state.");
    console.log("To apply: set TAXONOMY_BACKUP_CONFIRMED=YES and TAXONOMY_MIGRATION_APPROVED=YES and pass --apply.");
    return;
  }

  if (process.env.TAXONOMY_BACKUP_CONFIRMED !== "YES") {
    abort("TAXONOMY_BACKUP_CONFIRMED is not YES. A verified backup must be confirmed first.");
  }
  if (process.env.TAXONOMY_MIGRATION_APPROVED !== "YES") {
    abort("TAXONOMY_MIGRATION_APPROVED is not YES. Explicit founder approval is required.");
  }

  // ── Pre-transaction drift gate ──────────────────────────────────────────────
  const preCats = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
  });
  const preById = new Map(preCats.map((c) => [c.id, c]));
  const slugSeen = new Map();
  const nameSeen = new Map();
  for (const c of preCats) {
    slugSeen.set(c.slug, (slugSeen.get(c.slug) ?? 0) + 1);
    nameSeen.set(c.name, (nameSeen.get(c.name) ?? 0) + 1);
    if (c.slug === "generelt") abort("`generelt` exists — never allowed.");
    if (!ALLOWED_PRE_MIGRATION_SLUGS.has(c.slug)) abort(`Unknown pre-migration slug: ${c.slug}`);
  }
  for (const [slug, n] of slugSeen) if (n > 1) abort(`Duplicate slug: ${slug}`);
  for (const [name, n] of nameSeen) if (n > 1) abort(`Duplicate name: ${name}`);
  for (const c of preCats) {
    if (c.parentId) {
      const parent = preById.get(c.parentId);
      if (!parent) abort(`Orphaned parentId on ${c.slug}`);
      if (parent.parentId) abort(`Depth > 2: ${c.slug} under ${parent.slug}`);
    }
  }
  const orphanBiz = await prisma.business.count({ where: { categoryId: { not: null }, category: { is: null } } });
  if (orphanBiz > 0) abort(`${orphanBiz} business(es) reference a missing Category.`);

  // Schema allows categoryId String?, so handle no-category businesses explicitly.
  const nullCatBiz = await prisma.business.findMany({ where: { categoryId: null }, select: { name: true } });
  if (nullCatBiz.length > 0) {
    const names = nullCatBiz.map((b) => `"${b.name ?? "(no name)"}"`).join(", ");
    abort(`${nullCatBiz.length} business(es) have no category assigned: ${names}. Assign a Subcategory first — not guessing.`);
  }

  // ── Verify the five test businesses match the captured expectations ─────────
  for (const e of EXPECTED_TEST_BUSINESSES) {
    const matches = await prisma.business.findMany({
      where: { name: e.name },
      select: { id: true, name: true, category: { select: { slug: true } } },
    });
    if (matches.length !== 1) {
      abort(`Expected exactly one business named "${e.name}", found ${matches.length}. Not guessing.`);
    }
    const current = matches[0].category?.slug ?? null;
    if (current !== e.fromSlug) {
      abort(`"${e.name}" current category "${current}" != expected "${e.fromSlug}". Data differs — stopping.`);
    }
  }

  const before = {
    categories: await prisma.category.count(),
    businesses: await prisma.business.count(),
  };

  await prisma.$transaction(async (tx) => {
    // 1. Top-level Categories (parents first).
    const topId = new Map();
    for (const top of TOP_LEVELS) {
      const row = await tx.category.upsert({
        where: { slug: top.slug },
        update: { name: top.no, parentId: null },
        create: { name: top.no, slug: top.slug },
      });
      topId.set(top.slug, row.id);
    }

    // 2. Subcategories — sets Kafe display, reparents restaurant/cafe -> mat,
    //    handverk -> tjenester, and creates the rest.
    const subId = new Map();
    for (const sub of SUBCATEGORIES) {
      const parentId = topId.get(sub.parent);
      const row = await tx.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.no, parentId },
        create: { name: sub.no, slug: sub.slug, parentId },
      });
      subId.set(sub.slug, row.id);
    }

    // 3. Reassign the five test businesses (categoryId only — no profile changes).
    //    Each update must affect exactly one row, else roll back.
    for (const e of EXPECTED_TEST_BUSINESSES) {
      const targetId = subId.get(e.toSlug);
      if (!targetId) throw new Error(`Missing target subcategory ${e.toSlug} for ${e.name}`);
      const res = await tx.business.updateMany({ where: { name: e.name }, data: { categoryId: targetId } });
      if (res.count !== 1) throw new Error(`Expected to update exactly 1 row for "${e.name}", updated ${res.count}.`);
    }

    // 4. Remove `annet` only when empty (no businesses, no children).
    const annet = await tx.category.findUnique({
      where: { slug: "annet" },
      select: { id: true, _count: { select: { businesses: true, children: true } } },
    });
    if (annet) {
      if (annet._count.businesses > 0 || annet._count.children > 0) {
        throw new Error("`annet` still has businesses or children — cannot remove.");
      }
      await tx.category.delete({ where: { id: annet.id } });
    }

    // 5. Validate the COMPLETE final taxonomy — throws to trigger rollback.
    const finalCats = await tx.category.findMany({ select: { id: true, name: true, slug: true, parentId: true } });
    const topRows = finalCats.filter((c) => c.parentId === null);
    const subRows = finalCats.filter((c) => c.parentId !== null);

    if (topRows.length !== TOP_LEVELS.length) throw new Error(`Expected ${TOP_LEVELS.length} top-level Categories, found ${topRows.length}.`);
    if (subRows.length !== SUBCATEGORIES.length) throw new Error(`Expected ${SUBCATEGORIES.length} Subcategories, found ${subRows.length}.`);
    const expectedTotal = TOP_LEVELS.length + SUBCATEGORIES.length;
    if (finalCats.length !== expectedTotal) throw new Error(`Expected ${expectedTotal} total Categories, found ${finalCats.length}.`);

    // Exact slug set — nothing missing, nothing extra.
    const expectedSlugs = new Set([...TOP_LEVELS.map((t) => t.slug), ...SUBCATEGORIES.map((s) => s.slug)]);
    const actualSlugs = new Set(finalCats.map((c) => c.slug));
    for (const s of expectedSlugs) if (!actualSlugs.has(s)) throw new Error(`Missing approved slug: ${s}`);
    for (const s of actualSlugs) if (!expectedSlugs.has(s)) throw new Error(`Unexpected slug remains: ${s}`);
    if (actualSlugs.has("annet") || actualSlugs.has("generelt")) throw new Error("annet/generelt still present.");

    // Per-row: canonical parent + canonical Norwegian display name; parent is
    // top-level (parentId = null); no third level.
    const idToRow = new Map(finalCats.map((c) => [c.id, c]));
    const topBySlug = new Map(TOP_LEVELS.map((t) => [t.slug, t]));
    const subBySlug = new Map(SUBCATEGORIES.map((s) => [s.slug, s]));
    for (const c of topRows) {
      const cfg = topBySlug.get(c.slug);
      if (!cfg) throw new Error(`Unexpected top-level: ${c.slug}`);
      if (c.name !== cfg.no) throw new Error(`Top-level ${c.slug} name "${c.name}" != "${cfg.no}".`);
    }
    for (const c of subRows) {
      const cfg = subBySlug.get(c.slug);
      if (!cfg) throw new Error(`Unexpected subcategory: ${c.slug}`);
      if (c.name !== cfg.no) throw new Error(`Subcategory ${c.slug} name "${c.name}" != "${cfg.no}".`);
      const parentRow = idToRow.get(c.parentId);
      if (!parentRow || parentRow.parentId !== null) throw new Error(`${c.slug} parent is not a top-level Category.`);
      if (parentRow.slug !== parentSlugOf(c.slug)) {
        throw new Error(`${c.slug} parent "${parentRow.slug}" != canonical "${parentSlugOf(c.slug)}".`);
      }
    }

    // Every business must be on an approved Subcategory with a canonical
    // top-level parent. Checked per-row (a null category relation would escape a
    // `category.parentId === null` filter, so we assert categoryId/relation too).
    const approvedSubSlugs = new Set(SUBCATEGORIES.map((s) => s.slug));
    const bizRows = await tx.business.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
        category: { select: { slug: true, parentId: true, parent: { select: { parentId: true } } } },
      },
    });
    for (const b of bizRows) {
      if (!b.categoryId || !b.category) throw new Error(`Business "${b.name}" has no category after migration.`);
      if (!approvedSubSlugs.has(b.category.slug)) throw new Error(`Business "${b.name}" is not on an approved Subcategory (${b.category.slug}).`);
      if (b.category.parentId === null) throw new Error(`Business "${b.name}" is assigned directly to a top-level Category.`);
      if (!b.category.parent || b.category.parent.parentId !== null) throw new Error(`Business "${b.name}" Subcategory parent is not a top-level Category.`);
    }

    // Business count unchanged (only categoryId moved).
    const afterBiz = await tx.business.count();
    if (afterBiz !== before.businesses) throw new Error(`Business count changed: ${before.businesses} -> ${afterBiz}.`);
  });

  const after = {
    categories: await prisma.category.count(),
    businesses: await prisma.business.count(),
  };

  console.log("MIGRATION SUCCESSFUL.");
  console.log(`  categories: ${before.categories} -> ${after.categories}`);
  console.log(`  businesses: ${before.businesses} -> ${after.businesses} (unchanged; only categoryId moved)`);
}

main()
  .catch((e) => {
    console.error("MIGRATION FAILED —", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
