import { prisma } from "@/lib/prisma";
import BusinessCard from "@/components/BusinessCard";
import { getTranslations } from "next-intl/server";
import { formatCity } from "@/lib/format";

interface SearchResultsProps {
  searchParams: {
    q?: string;
    category?: string;
    city?: string;
    sort?: string;
  };
}


// TEMP PERF — remove after audit
async function perf<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const s = performance.now();
  try { return await fn(); }
  finally { console.log(`[perf] ${label}: ${(performance.now() - s).toFixed(1)}ms`); }
}

export default async function SearchResults({ searchParams }: SearchResultsProps) {
  console.log("[perf] ── SearchResults (streamed Suspense) start ──");
  const t = await perf("results.getTranslations", () => getTranslations("searchResults"));
  const { q, category, city, sort = "popular" } = searchParams;

  // ── Build where clause ────────────────────────────────────────────────────
  const where: any = { status: "APPROVED" };

  if (q?.trim()) {
    where.OR = [
      { name:        { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { city:        { contains: q, mode: "insensitive" } },
    ];
  }

  // Folded into the main query as a relation filter — this used to be a
  // separate, sequential `category.findUnique` round trip.
  if (category) {
    where.category = { slug: category };
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  // ── Build orderBy ─────────────────────────────────────────────────────────
  let orderBy: any = { views: "desc" };
  if (sort === "newest")      orderBy = { createdAt: "desc" };
  if (sort === "alpha")       orderBy = { name: "asc" };
  if (sort === "reviewed")    orderBy = { reviews: { _count: "desc" } };

  // ── Query ─────────────────────────────────────────────────────────────────
  // Two independent queries run CONCURRENTLY:
  //   1. the page of businesses (only the fields the card renders)
  //   2. rating averages/counts aggregated in the database
  // Previously every individual review row was fetched and averaged in JS.
  const [businesses, ratingGroups] = await Promise.all([
    perf("results.business.findMany", () =>
      prisma.business.findMany({
        where,
        select: {
          id:         true,
          name:       true,
          description: true,
          city:       true,
          status:     true,
          logo:       true,
          coverImage: true,
          category:   { select: { name: true, slug: true } },
          _count:     { select: { branches: true } },
        },
        orderBy,
        take: 48,
      })),
    perf("results.review.groupBy(rating)", () =>
      prisma.review.groupBy({
        by: ["businessId"],
        where: { business: where },
        _avg: { rating: true },
        _count: { rating: true },
      })),
  ]);

  const ratingsByBusiness = new Map(
    ratingGroups.map((g) => [g.businessId, { avg: g._avg.rating, count: g._count.rating }])
  );
  console.log(`[perf] results.rows=${businesses.length} ratingGroups=${ratingGroups.length} (review rows fetched: 0)`);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (businesses.length === 0) {
    const hasFilters = q || category || city;
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.15 6.15a7.5 7.5 0 0 0 10.5 10.5z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {hasFilters ? t("noResults") : t("noBusinesses")}
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          {hasFilters ? t("adjustFilters") : t("checkBack")}
        </p>
        {hasFilters && (
          <a
            href="/search"
            className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            {t("clearFilters")}
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Result count */}
      <p className="text-sm text-gray-500 mb-5">
        <span className="font-semibold text-gray-900">{businesses.length}</span>{" "}
        {businesses.length === 1 ? t("businessSingular") : t("businessPlural")} {t("found")}
        {q    && <> {t("for")} <span className="font-medium text-gray-700">&quot;{q}&quot;</span></>}
        {city && <> {t("in")} <span className="font-medium text-gray-700">{formatCity(city)}</span></>}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {businesses.map((b) => {
          const stats  = ratingsByBusiness.get(b.id);
          const rating = stats?.avg ?? null;
          return (
            <BusinessCard
              key={b.id}
              id={b.id}
              name={b.name ?? ""}
              description={b.description ?? ""}
              category={b.category?.name ?? ""}
              categorySlug={b.category?.slug}
              city={b.city ?? ""}
              verified={b.status === "APPROVED"}
              logo={b.logo}
              coverImage={b.coverImage}
              rating={rating}
              reviewCount={stats?.count ?? 0}
              branchCount={b._count.branches}
              highlight={q}
            />
          );
        })}
      </div>
    </div>
  );
}
