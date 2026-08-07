/**
 * Pure classification logic for the Taxonomy v1 migration preflight.
 *
 * No I/O — the caller supplies plain category/business snapshots. This makes the
 * "expected vs blocking" behavior testable without a database
 * (see scripts/check-preflight-logic.js).
 */
import { TOP_LEVELS, SUBCATEGORIES, isTopLevelSlug } from "@/lib/taxonomy-v1";

export interface PreflightCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  businessCount: number;
  childCount: number;
}

export interface PreflightBusiness {
  name: string;
  categoryId: string | null;
  categorySlug: string | null;
  categoryParentId: string | null;
}

export interface PreflightExpectedBusiness {
  name: string;
  fromSlug: string;
}

export interface PreflightResult {
  expected: string[];
  blocking: string[];
}

const APPROVED_SLUGS = new Set([
  ...TOP_LEVELS.map((t) => t.slug),
  ...SUBCATEGORIES.map((s) => s.slug),
]);

/** Slugs allowed to exist before the migration: approved slugs + legacy `annet`. */
const ALLOWED_PRE_MIGRATION = new Set([...APPROVED_SLUGS, "annet"]);

export function classifyPreflight(
  categories: PreflightCategory[],
  businesses: PreflightBusiness[],
  expectedTestBusinesses: PreflightExpectedBusiness[]
): PreflightResult {
  const expected: string[] = [];
  const blocking: string[] = [];

  const byId = new Map(categories.map((c) => [c.id, c]));
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  // Duplicate slugs / names.
  const slugCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();
  for (const c of categories) {
    slugCounts.set(c.slug, (slugCounts.get(c.slug) ?? 0) + 1);
    nameCounts.set(c.name, (nameCounts.get(c.name) ?? 0) + 1);
  }
  for (const [slug, n] of slugCounts) if (n > 1) blocking.push(`Duplicate slug: ${slug}`);
  for (const [name, n] of nameCounts) if (n > 1) blocking.push(`Duplicate name: ${name}`);

  // Unknown slugs, generelt, orphans, depth.
  for (const c of categories) {
    if (c.slug === "generelt") blocking.push("`generelt` exists — never allowed.");
    else if (!ALLOWED_PRE_MIGRATION.has(c.slug)) blocking.push(`Unknown slug outside Taxonomy v1 (+annet): ${c.slug}`);
    if (c.parentId) {
      const parent = byId.get(c.parentId);
      if (!parent) blocking.push(`Orphaned parentId on ${c.slug}`);
      else if (parent.parentId) blocking.push(`Depth > 2: ${c.slug} under ${parent.slug}`);
    }
  }

  // Business with no category, or referencing a missing Category — both blocking.
  // (schema allows categoryId String? so this must be handled explicitly.)
  for (const b of businesses) {
    if (!b.categoryId) blocking.push(`Business "${b.name}" has no category assigned.`);
    else if (!b.categorySlug) blocking.push(`Business "${b.name}" references a missing Category.`);
  }

  // Test businesses: exactly one each, and on the expected pre-migration category.
  for (const e of expectedTestBusinesses) {
    const matches = businesses.filter((b) => b.name === e.name);
    if (matches.length === 0) blocking.push(`Missing expected test business: ${e.name}`);
    else if (matches.length > 1) blocking.push(`Duplicate test-business name: ${e.name}`);
    else if (matches[0].categorySlug !== e.fromSlug) {
      blocking.push(`Test business "${e.name}" on "${matches[0].categorySlug}" != expected "${e.fromSlug}"`);
    }
  }

  // ── Expected pre-migration changes ──────────────────────────────────────────
  for (const slug of ["restaurant", "cafe", "handverk"]) {
    const c = bySlug.get(slug);
    if (c && c.parentId === null) expected.push(`\`${slug}\` is still flat (will be reparented).`);
  }
  for (const c of categories) {
    if (isTopLevelSlug(c.slug) && c.parentId === null && c.businessCount > 0) {
      expected.push(`\`${c.slug}\` currently has businesses directly assigned (will move to Subcategories).`);
    }
  }
  const annet = bySlug.get("annet");
  if (annet) expected.push(`\`annet\` exists with ${annet.businessCount} business(es) (removed after reassignment).`);
  const missing = [...APPROVED_SLUGS].filter((s) => !bySlug.has(s));
  if (missing.length > 0) expected.push(`Missing future Taxonomy v1 rows to create: ${missing.length}.`);

  return { expected, blocking };
}
