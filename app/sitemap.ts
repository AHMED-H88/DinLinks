import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLIC_DISCOVERY_WHERE } from "@/lib/discovery";
import { routing } from "@/i18n/routing";
import {
  buildBusinessEntries,
  buildCategoryEntries,
  buildStaticEntries,
  countByCategory,
  deriveCategoryCounts,
} from "@/lib/sitemap-entries";

// Regenerated at most hourly: the sitemap may lag an approved business or
// category change by up to ~1 hour (accepted). The pages themselves — and
// their meta indexability — flip live; only this file trails. No manual
// invalidation in PR-6. Without a revalidate the route would be frozen at
// build time until the next deploy.
export const revalidate = 3600;

/**
 * Canonical, indexable URLs only — the handoff §3 matrix's include column.
 * Two queries total regardless of category count (no per-category count()):
 * the category tree once, and ONE PUBLIC_DISCOVERY_WHERE business dataset
 * that simultaneously decides which businesses are listed, which categories
 * are populated, and how many pagination pages each owns — so no second
 * discovery rule can emerge. Explicit orderBy on immutable unique keys keeps
 * the output stable across runs; database row order is never relied on.
 *
 * Single file, no index: the 50,000-URL / 50 MB sitemap protocol limit is
 * orders of magnitude away at DinLinks' inventory; shard via
 * generateSitemaps() only if that ever approaches.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, businesses] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, slug: true, children: { select: { id: true } } },
      orderBy: { slug: "asc" },
    }),
    // Only what eligibility (the where), category counting (categoryId), and
    // canonical URL construction (id/name/shortId/isDemo) need. Deliberately
    // NOT updatedAt: it is @updatedAt and the profile page's view counter
    // bumps it on ordinary visits, so it cannot honestly feed a sitemap
    // lastModified — none is emitted (see lib/sitemap-entries.ts).
    prisma.business.findMany({
      where: PUBLIC_DISCOVERY_WHERE,
      select: {
        id: true,
        name: true,
        shortId: true,
        isDemo: true,
        categoryId: true,
      },
      orderBy: { id: "asc" },
    }),
  ]);

  const categoryCounts = deriveCategoryCounts(
    categories,
    countByCategory(businesses),
  );

  return [
    ...buildStaticEntries(routing.locales),
    ...buildCategoryEntries(categoryCounts, routing.locales),
    ...buildBusinessEntries(businesses),
  ];
}
