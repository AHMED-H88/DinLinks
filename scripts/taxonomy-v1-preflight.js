/**
 * taxonomy:preflight — READ-ONLY Taxonomy v1 migration preflight.
 *
 * Prints the current categories, business assignments and a proposed operation
 * plan, and separates findings into:
 *   A. Expected pre-migration changes (fine — exit 0)
 *   B. Blocking integrity problems   (exit 1)
 *
 * It NEVER writes, never rewrites user data, and never prints credentials or the
 * connection string. Run via tsx. Do NOT run against Production during
 * implementation. Classification logic lives in
 * lib/taxonomy-v1-preflight-logic.ts and is unit-tested without a database.
 */
import { PrismaClient } from "@prisma/client";
import { TOP_LEVELS, SUBCATEGORIES, TEST_BUSINESS_ASSIGNMENTS } from "../lib/taxonomy-v1";
import { classifyPreflight } from "../lib/taxonomy-v1-preflight-logic";

const prisma = new PrismaClient();

async function run() {
  console.log("=== Taxonomy v1 Preflight (READ-ONLY) ===\n");

  const categoryRows = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      _count: { select: { businesses: true, children: true } },
    },
    orderBy: { slug: "asc" },
  });

  const businessRows = await prisma.business.findMany({
    select: { id: true, name: true, categoryId: true, category: { select: { slug: true, parentId: true } } },
    orderBy: { name: "asc" },
  });

  console.log("Current categories:");
  for (const c of categoryRows) {
    console.log(
      `  ${c.slug.padEnd(18)} name="${c.name}" parentId=${c.parentId ?? "null"} ` +
        `businesses=${c._count.businesses} children=${c._count.children}`
    );
  }
  console.log("\nCurrent business assignments:");
  for (const b of businessRows) {
    console.log(`  ${(b.name ?? "(no name)").padEnd(18)} -> ${b.category?.slug ?? "(none)"} (parentId=${b.category?.parentId ?? "null"})`);
  }

  // ── Classification (pure) ────────────────────────────────────────────────────
  const categories = categoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    businessCount: c._count.businesses,
    childCount: c._count.children,
  }));
  const businesses = businessRows.map((b) => ({
    name: b.name ?? "",
    categoryId: b.categoryId,
    categorySlug: b.category?.slug ?? null,
    categoryParentId: b.category?.parentId ?? null,
  }));

  const { expected, blocking } = classifyPreflight(categories, businesses, TEST_BUSINESS_ASSIGNMENTS);

  console.log("\nA. Expected pre-migration changes:");
  if (expected.length === 0) console.log("  (none)");
  for (const e of expected) console.log(`  - ${e}`);

  console.log("\nB. Blocking integrity problems:");
  if (blocking.length === 0) console.log("  (none)");
  for (const b of blocking) console.log(`  - ${b}`);

  // ── Proposed plan ────────────────────────────────────────────────────────────
  const missingTops = TOP_LEVELS.filter((t) => !categories.some((c) => c.slug === t.slug));
  const missingSubs = SUBCATEGORIES.filter((s) => !categories.some((c) => c.slug === s.slug));
  console.log("\nProposed operation plan (not executed):");
  console.log(`  1. Create ${missingTops.length} missing top-level, ${missingSubs.length} missing Subcategories.`);
  console.log('  2. Set "Kafe" for slug cafe; reparent restaurant, cafe -> mat; handverk -> tjenester.');
  console.log("  3. Reassign the 5 test businesses; remove `annet` when empty; validate the full hierarchy.");

  if (blocking.length > 0) {
    process.exitCode = 1;
    console.log("\nRESULT: BLOCKED — resolve the blocking problems above before migrating.");
  } else {
    console.log("\nRESULT: OK — only expected pre-migration changes remain.");
  }
  console.log("(READ-ONLY preflight complete — no data was modified.)");
}

run()
  .catch((e) => {
    console.error("Preflight error:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
