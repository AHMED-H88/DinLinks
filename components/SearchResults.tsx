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

function avgRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export default async function SearchResults({ searchParams }: SearchResultsProps) {
  const t = await getTranslations("searchResults");
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

  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } });
    if (cat) where.categoryId = cat.id;
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
  const businesses = await prisma.business.findMany({
    where,
    include: {
      category: true,
      reviews:  { select: { rating: true } },
      _count:   { select: { branches: true } },
    },
    orderBy,
    take: 48,
  });

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
          const rating = avgRating(b.reviews);
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
              reviewCount={b.reviews.length}
              branchCount={b._count.branches}
              highlight={q}
            />
          );
        })}
      </div>
    </div>
  );
}
