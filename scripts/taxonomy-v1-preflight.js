/**
 * taxonomy:preflight — READ-ONLY Taxonomy v1 migration preflight.
 *
 * Prints the current categories, business assignments and a proposed operation
 * plan, and flags integrity problems. It NEVER writes, never rewrites user data,
 * and never prints credentials or the connection string.
 *
 * Run via tsx (see package.json). Requires DATABASE access to whatever the
 * environment points at — do NOT run against Production during implementation.
 */
import { PrismaClient } from "@prisma/client";
import {
  TOP_LEVELS,
  SUBCATEGORIES,
  isTopLevelSlug,
  isSubcategorySlug,
  TEST_BUSINESS_ASSIGNMENTS,
} from "../lib/taxonomy-v1";

const prisma = new PrismaClient();

/** The five known test businesses and their captured pre-migration state. */
const EXPECTED_TEST_BUSINESSES = TEST_BUSINESS_ASSIGNMENTS;

async function run() {
  console.log("=== Taxonomy v1 Preflight (READ-ONLY) ===\n");

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      _count: { select: { businesses: true, children: true } },
    },
    orderBy: { slug: "asc" },
  });

  console.log("Current categories:");
  for (const c of categories) {
    console.log(
      `  ${c.slug.padEnd(18)} name="${c.name}" parentId=${c.parentId ?? "null"} ` +
        `businesses=${c._count.businesses} children=${c._count.children}`
    );
  }

  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, categoryId: true, category: { select: { slug: true, parentId: true } } },
    orderBy: { name: "asc" },
  });

  console.log("\nCurrent business assignments:");
  for (const b of businesses) {
    console.log(`  ${(b.name ?? "(no name)").padEnd(18)} -> ${b.category?.slug ?? "(none)"} (parentId=${b.category?.parentId ?? "null"})`);
  }

  // ── Integrity checks ────────────────────────────────────────────────────────
  const problems = [];
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const byId = new Map(categories.map((c) => [c.id, c]));

  const nameCounts = new Map();
  const slugCounts = new Map();
  for (const c of categories) {
    slugCounts.set(c.slug, (slugCounts.get(c.slug) ?? 0) + 1);
    nameCounts.set(c.name, (nameCounts.get(c.name) ?? 0) + 1);
  }
  for (const [slug, n] of slugCounts) if (n > 1) problems.push(`Duplicate slug: ${slug}`);
  for (const [name, n] of nameCounts) if (n > 1) problems.push(`Duplicate name: ${name}`);

  for (const c of categories) {
    if (c.parentId && !byId.has(c.parentId)) problems.push(`Orphaned parentId on ${c.slug}`);
    if (c.parentId) {
      const parent = byId.get(c.parentId);
      if (parent && parent.parentId) problems.push(`Depth > 2: ${c.slug} under ${parent.slug} which has a parent`);
    }
    if (c.slug === "annet" || c.slug === "generelt") {
      // Present now, must be removed by the migration — informational, not fatal.
      console.log(`\nNote: forbidden category present (expected pre-migration): ${c.slug}`);
    }
    if (!isTopLevelSlug(c.slug) && !isSubcategorySlug(c.slug) && c.slug !== "annet") {
      problems.push(`Unexpected category slug not in Taxonomy v1: ${c.slug}`);
    }
  }

  for (const b of businesses) {
    if (b.categoryId && !b.category) problems.push(`Business "${b.name}" references a missing category`);
    if (b.category && b.category.parentId === null && b.category.slug !== "annet") {
      // Directly on a (real) top-level slug — must be reassigned to a subcategory.
      if (isTopLevelSlug(b.category.slug)) {
        console.log(`Note: "${b.name}" is directly on top-level "${b.category.slug}" — must move to a subcategory.`);
      }
    }
  }

  // ── Proposed operation plan ─────────────────────────────────────────────────
  console.log("\nProposed operation plan (not executed):");
  const missingTops = TOP_LEVELS.filter((t) => !bySlug.has(t.slug));
  console.log(`  1. Create ${missingTops.length} missing top-level Categories: ${missingTops.map((t) => t.slug).join(", ") || "(none)"}`);
  const missingSubs = SUBCATEGORIES.filter((s) => !bySlug.has(s.slug));
  console.log(`  2. Create ${missingSubs.length} missing Subcategories.`);
  console.log('  3. Set display name "Kafe" for slug cafe; reparent restaurant, cafe -> mat; handverk -> tjenester.');
  console.log("  4. Reassign the 5 test businesses to their approved temporary Subcategories.");
  console.log("  5. Remove `annet` once it has no businesses and no children.");
  console.log("  6. Validate the full two-level hierarchy.");

  console.log("\nExpected test businesses and approved temporary assignments:");
  for (const e of EXPECTED_TEST_BUSINESSES) {
    console.log(`  ${e.name.padEnd(18)} ${e.fromSlug} -> ${e.toTop}/${e.toSlug}`);
  }

  if (problems.length > 0) {
    console.log("\nINTEGRITY PROBLEMS:");
    for (const p of problems) console.log(`  - ${p}`);
  } else {
    console.log("\nNo blocking integrity problems detected.");
  }

  console.log("\n(READ-ONLY preflight complete — no data was modified.)");
}

run()
  .catch((e) => {
    console.error("Preflight error:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
