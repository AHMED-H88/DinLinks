import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

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
        _count: { select: { businesses: { where: { status: "APPROVED" } } } },
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

/** Most common cities across approved businesses (search filter sidebar). */
export const getCityCounts = unstable_cache(
  async () => {
    const start = performance.now();
    const groups = await prisma.business.groupBy({
      by: ["city"],
      where: { status: "APPROVED", city: { not: null } },
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
