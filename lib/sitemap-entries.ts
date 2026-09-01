import type { MetadataRoute } from "next";
import { SITE_URL, businessUrl, type BusinessUrlParts } from "@/lib/site";
import {
  CATEGORY_PAGE_SIZE,
  canonicalCategorySearch,
  categoryTargetIds,
} from "@/lib/category-listing";

/**
 * Pure builders for the sitemap. Kept free of Prisma and React (the queries
 * live in app/sitemap.ts) so every inclusion rule is unit-testable, and so no
 * competing rule can grow here: public visibility is PUBLIC_DISCOVERY_WHERE
 * (applied by the caller's query), business URLs come from businessUrl(),
 * category population comes from categoryTargetIds(), and pagination form
 * comes from canonicalCategorySearch() — this module only assembles them.
 *
 * The sitemap carries canonical, indexable URLs only, and deliberately NO
 * hreflang annotations (no alternates, no xhtml:link): PR-3 made HTML
 * metadata the single authoritative hreflang system, and a second emitter
 * would be a second system to keep truthful. Each eligible localized URL is
 * simply its own entry. No changeFrequency and no priority anywhere — both
 * would be guessed values; lastModified only where a truthful stored
 * timestamp exists (Business.updatedAt).
 */

/**
 * The indexable static surfaces, as locale-less paths ("" = homepage). Both
 * locales of each are indexable and self-canonical (PR-2), so both enter the
 * sitemap. The unprefixed root "/" is a locale-negotiating 307, never listed.
 */
export const STATIC_PATHS = [
  "",
  "/categories",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
] as const;

export function buildStaticEntries(
  locales: readonly string[],
): MetadataRoute.Sitemap {
  return STATIC_PATHS.flatMap((path) =>
    locales.map((locale) => ({ url: `${SITE_URL}/${locale}${path}` })),
  );
}

/** A category row as the sitemap query selects it. */
export type SitemapCategory = {
  id: string;
  slug: string;
  children: readonly { id: string }[];
};

/**
 * categoryId -> discoverable-business count, from the single already-filtered
 * public business dataset. Grouping in memory keeps the sitemap at two
 * queries total — never one count() per category — and guarantees the same
 * rows that become business entries also decide category population.
 */
export function countByCategory(
  businesses: readonly { categoryId: string | null }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const b of businesses) {
    if (!b.categoryId) continue;
    counts.set(b.categoryId, (counts.get(b.categoryId) ?? 0) + 1);
  }
  return counts;
}

/**
 * Each category's qualifying count under the exact category-page semantics:
 * sum over its targetIds (children if any, else self). A business attached
 * directly to a top level that has children is counted by neither the page
 * nor this — the two can never disagree about which categories are populated.
 */
export function deriveCategoryCounts(
  categories: readonly SitemapCategory[],
  countByCategoryId: ReadonlyMap<string, number>,
): { slug: string; count: number }[] {
  return categories.map((category) => ({
    slug: category.slug,
    count: categoryTargetIds(category).reduce(
      (sum, id) => sum + (countByCategoryId.get(id) ?? 0),
      0,
    ),
  }));
}

/**
 * Entries for every populated category page, in canonical default-sort form
 * only: page 1 is the bare URL, pages 2..ceil(count / CATEGORY_PAGE_SIZE) are
 * `?page=N`. Zero count means zero entries (D6: the empty page exists but is
 * noindexed). Never `?page=1`, never a sort or tracking parameter, never a
 * page beyond the last — the same range the page itself hard-404s outside.
 */
export function buildCategoryEntries(
  categories: readonly { slug: string; count: number }[],
  locales: readonly string[],
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const category of categories) {
    if (category.count <= 0) continue;
    const totalPages = Math.ceil(category.count / CATEGORY_PAGE_SIZE);
    for (const locale of locales) {
      for (let page = 1; page <= totalPages; page++) {
        entries.push({
          url: `${SITE_URL}/${locale}/categories/${category.slug}${canonicalCategorySearch(page)}`,
        });
      }
    }
  }
  return entries;
}

/** A business row as the sitemap query selects it. */
export type SitemapBusiness = BusinessUrlParts & { updatedAt: Date };

/**
 * One entry per discoverable business — the caller's query is
 * PUBLIC_DISCOVERY_WHERE, so demos and non-APPROVED rows cannot reach here by
 * construction. Norwegian URL only (D2: /en/business/* is noindexed and stays
 * out), in canonical form via businessUrl() — never hand-built, so a row with
 * a NULL shortId advertises its id URL, which for such a row IS the
 * canonical. lastModified is the stored updatedAt — real data, not a guess.
 */
export function buildBusinessEntries(
  businesses: readonly SitemapBusiness[],
): MetadataRoute.Sitemap {
  return businesses.map((b) => ({
    url: businessUrl("no", b),
    lastModified: b.updatedAt,
  }));
}
