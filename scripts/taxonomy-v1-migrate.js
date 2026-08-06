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
import { TOP_LEVELS, SUBCATEGORIES, TEST_BUSINESS_ASSIGNMENTS } from "../lib/taxonomy-v1";

const EXPECTED_TEST_BUSINESSES = TEST_BUSINESS_ASSIGNMENTS;

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
    for (const e of EXPECTED_TEST_BUSINESSES) {
      const targetId = subId.get(e.toSlug);
      if (!targetId) throw new Error(`Missing target subcategory ${e.toSlug} for ${e.name}`);
      await tx.business.updateMany({ where: { name: e.name }, data: { categoryId: targetId } });
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

    // 5. Validate the full hierarchy — throws to trigger rollback on failure.
    const tops = await tx.category.findMany({ where: { parentId: null }, select: { slug: true } });
    if (tops.length !== 8) throw new Error(`Expected 8 top-level Categories, found ${tops.length}.`);
    const expectedTop = new Set(TOP_LEVELS.map((t) => t.slug));
    for (const t of tops) if (!expectedTop.has(t.slug)) throw new Error(`Unexpected top-level: ${t.slug}`);

    const deepChildren = await tx.category.findMany({
      where: { parent: { parentId: { not: null } } },
      select: { slug: true },
    });
    if (deepChildren.length > 0) throw new Error(`Third level detected: ${deepChildren.map((c) => c.slug).join(", ")}`);

    const onTopLevel = await tx.business.count({ where: { category: { parentId: null } } });
    if (onTopLevel > 0) throw new Error(`${onTopLevel} business(es) still assigned directly to a top-level Category.`);

    const forbidden = await tx.category.findMany({ where: { slug: { in: ["annet", "generelt"] } }, select: { slug: true } });
    if (forbidden.length > 0) throw new Error(`Forbidden category still present: ${forbidden.map((c) => c.slug).join(", ")}`);

    const restaurant = await tx.category.findUnique({ where: { slug: "restaurant" }, select: { parentId: true } });
    const cafe = await tx.category.findUnique({ where: { slug: "cafe" }, select: { parentId: true, name: true } });
    const handverk = await tx.category.findUnique({ where: { slug: "handverk" }, select: { parentId: true } });
    if (restaurant?.parentId !== topId.get("mat")) throw new Error("restaurant is not parented to mat.");
    if (cafe?.parentId !== topId.get("mat")) throw new Error("cafe is not parented to mat.");
    if (cafe?.name !== "Kafe") throw new Error("cafe display name is not 'Kafe'.");
    if (handverk?.parentId !== topId.get("tjenester")) throw new Error("handverk is not parented to tjenester.");
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
