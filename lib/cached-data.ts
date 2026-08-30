import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { topLevelOrder, subOrder } from "@/lib/taxonomy-v1";
import { PUBLIC_DISCOVERY_WHERE } from "@/lib/discovery";

/**
 * Cross-request caches for PUBLIC, NON-USER-SPECIFIC reference data only.
 *
 * Never put sessions, favorites, auth state or per-user results in here —
 * `unstable_cache` results are shared across all visitors.
 *
 * Only plain scalar fields are selected so the cached payload serialises
 * cleanly (no Date/Decimal round-trip surprises) and stays small.
 */

const CATEGORY_TTL = 3600; // 1h — categories change only via the admin screen
const CITY_TTL     = 900;  // 15m — derived from business rows, changes slowly

/** Categories for the search filter sidebar. */
export const getFilterCategories = unstable_cache(
  async () => {
    const start = performance.now();
    const rows = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    // TEMP PERF — only logs on a cache MISS (i.e. a real DB round trip)
    console.log(`[perf] cache MISS getFilterCategories: ${(performance.now() - start).toFixed(1)}ms`);
    return rows;
  },
  ["filter-categories-v1"],
  { revalidate: CATEGORY_TTL, tags: ["categories"] }
);

/** Categories plus their approved-business counts (home + categories pages). */
export const getCategoriesWithCounts = unstable_cache(
  async () => {
    const start = performance.now();
    const rows = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        _count: { select: { businesses: { where: PUBLIC_DISCOVERY_WHERE } } },
      },
    });
    console.log(`[perf] cache MISS getCategoriesWithCounts: ${(performance.now() - start).toFixed(1)}ms`);
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      count: c._count.businesses,
    }));
  },
  ["categories-with-counts-v1"],
  { revalidate: CITY_TTL, tags: ["categories", "businesses"] }
);

/**
 * Taxonomy v1 tree — top-level Categories (parentId = null) each with their
 * Subcategories and approved-business counts. Ordered by the approved Taxonomy
 * v1 order (not DB creation order or alphabetical).
 *
 * A top-level count is the sum of approved businesses across its Subcategories.
 * Businesses temporarily assigned directly to a top-level Category (a
 * pre-migration state) are intentionally NOT counted here — the final data
 * model requires every business to live in a Subcategory.
 *
 * Explicit selects only (no broad implicit selects) so a schema drift like the
 * previous `parentId` incident cannot surface at runtime.
 */
export const getTaxonomyTree = unstable_cache(
  async () => {
    const start = performance.now();
    const rows = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        parentId: true,
        _count: { select: { businesses: { where: PUBLIC_DISCOVERY_WHERE } } },
      },
    });
    console.log(`[perf] cache MISS getTaxonomyTree: ${(performance.now() - start).toFixed(1)}ms`);

    const tops = rows.filter((r) => r.parentId === null);
    const subs = rows.filter((r) => r.parentId !== null);

    return tops
      .map((t) => {
        const children = subs
          .filter((s) => s.parentId === t.id)
          .map((s) => ({ id: s.id, name: s.name, slug: s.slug, icon: s.icon, count: s._count.businesses }))
          .sort((a, b) => subOrder(a.slug) - subOrder(b.slug));
        const count = children.reduce((sum, c) => sum + c.count, 0);
        return { id: t.id, name: t.name, slug: t.slug, icon: t.icon, count, childCount: children.length, children };
      })
      .sort((a, b) => topLevelOrder(a.slug) - topLevelOrder(b.slug));
  },
  ["taxonomy-tree-v1"],
  { revalidate: CITY_TTL, tags: ["categories", "businesses"] }
);

/**
 * Top-level Categories only (parentId = null), in approved Taxonomy v1 order,
 * with their Subcategory-derived counts. Convenience wrapper over the tree for
 * the Homepage shortcuts and Categories index.
 */
export async function getTopLevelCategories() {
  const tree = await getTaxonomyTree();
  return tree.map(({ id, name, slug, icon, count, childCount }) => ({ id, name, slug, icon, count, childCount }));
}

/** Most common cities across approved businesses (search filter sidebar). */
export const getCityCounts = unstable_cache(
  async () => {
    const start = performance.now();
    const groups = await prisma.business.groupBy({
      by: ["city"],
      where: { ...PUBLIC_DISCOVERY_WHERE, city: { not: null } },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 20,
    });
    console.log(`[perf] cache MISS getCityCounts: ${(performance.now() - start).toFixed(1)}ms`);
    return groups
      .filter((g) => g.city)
      .map((g) => ({ city: g.city as string, count: g._count.city }));
  },
  ["city-counts-v1"],
  { revalidate: CITY_TTL, tags: ["businesses"] }
);
