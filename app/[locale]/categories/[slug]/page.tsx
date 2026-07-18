import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { formatCity } from "@/lib/format";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import CategorySortBar from "@/components/CategorySortBar";

// No `force-dynamic`: this page reads `searchParams` (sort / page), which
// already forces dynamic rendering. The flag was redundant.

const PAGE_SIZE = 12;

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "categoryPage" });
  const tCat = await getTranslations({ locale, namespace: "categories" });
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: t("metaNotFound") };

  const count = await prisma.business.count({
    where: { categoryId: category.id, status: "APPROVED" },
  });

  const catName = tCat.has(category.slug) ? tCat(category.slug) : category.name;

  return {
    title: t("metaTitle", { category: catName }),
    description: t("metaDescription", { count, category: catName.toLowerCase() }),
    openGraph: {
      title: t("ogTitle", { category: catName }),
      description: t("ogDescription", { count, category: catName.toLowerCase() }),
      type: "website",
    },
    alternates: {
      canonical: `/categories/${slug}`,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avgRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function buildOrderBy(sort: string): any {
  switch (sort) {
    case "reviewed":  return { reviews:   { _count: "desc" } };
    case "newest":    return { createdAt: "desc" };
    case "alpha":     return { name:      "asc"  };
    default:          return { views:     "desc" };   // popular
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: { sort?: string; page?: string };
}) {
  const { slug } = await params;
  const t         = await getTranslations("categoryPage");
  const tCat      = await getTranslations("categories");
  const sort      = searchParams.sort ?? "popular";
  const page      = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const catName = tCat.has(category.slug) ? tCat(category.slug) : category.name;

  const [total, businesses, cityGroups] = await Promise.all([
    prisma.business.count({ where: { categoryId: category.id, status: "APPROVED" } }),

    prisma.business.findMany({
      where:   { categoryId: category.id, status: "APPROVED" },
      include: { reviews: { select: { rating: true } }, _count: { select: { branches: true } } },
      orderBy: buildOrderBy(sort),
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
    }),

    prisma.business.groupBy({
      by:      ["city"],
      where:   { categoryId: category.id, status: "APPROVED", city: { not: null } },
      _count:  { city: true },
      orderBy: { _count: { city: "desc" } },
      take:    8,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const cities     = cityGroups.filter((g) => g.city).map((g) => g.city as string);

  // ── JSON-LD (ItemList of businesses) ─────────────────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "ItemList",
    name:       `${category.name} businesses on DinLinks`,
    numberOfItems: total,
    itemListElement: businesses.map((b, i) => ({
      "@type":    "ListItem",
      position:  (page - 1) * PAGE_SIZE + i + 1,
      name:       b.name ?? "",
      url:       `${process.env.NEXTAUTH_URL ?? "https://dinlinks.no"}/en/business/${b.id}`,
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-gray-100 py-10 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
              <Link href="/"          className="hover:text-gray-600 transition-colors">{t("home")}</Link>
              <span>/</span>
              <Link href="/categories" className="hover:text-gray-600 transition-colors">{t("categories")}</Link>
              <span>/</span>
              <span className="text-gray-700 font-medium">{catName}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{catName}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium text-gray-700">{total}</span>{" "}
                  {total === 1 ? t("verifiedBusinessSingular") : t("verifiedBusinessPlural")}
                  {cities.length > 0 && (
                    <> · {cities.slice(0, 4).map(formatCity).join(", ")}{cities.length > 4 ? ` ${t("andMore")}` : ""}</>
                  )}
                </p>
              </div>

              {/* Sort bar */}
              <div className="sm:ml-auto">
                <CategorySortBar currentSort={sort} slug={slug} />
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-10 px-4">
          <div className="max-w-7xl mx-auto">
            {businesses.length === 0 ? (
              <EmptyCategory name={catName} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
                  {businesses.map((b) => (
                    <BusinessCard
                      key={b.id}
                      id={b.id}
                      name={b.name ?? ""}
                      description={b.description ?? ""}
                      category={catName}
                      categorySlug={category.slug}
                      city={b.city ?? ""}
                      verified={b.status === "APPROVED"}
                      logo={b.logo}
                      coverImage={b.coverImage}
                      rating={avgRating(b.reviews)}
                      reviewCount={b.reviews.length}
                      branchCount={b._count.branches}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    slug={slug}
                    sort={sort}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyCategory({ name }: { name: string }) {
  const t = useTranslations("categoryPage");
  return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4">🏢</div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">
        {t("noBusinesses", { category: name.toLowerCase() })}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        {t("beFirst", { category: name.toLowerCase() })}
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
      >
        {t("listYourBusiness")}
      </Link>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  slug,
  sort,
}: {
  page: number;
  totalPages: number;
  slug: string;
  sort: string;
}) {
  function href(p: number) {
    const params = new URLSearchParams();
    if (sort && sort !== "popular") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/categories/${slug}${qs ? `?${qs}` : ""}`;
  }

  // Show at most 7 page buttons: always first, last, current ±2, and ellipsis
  const window = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= window) {
      pages.push(i);
    } else if (
      (i === page - window - 1 && i > 1) ||
      (i === page + window + 1 && i < totalPages)
    ) {
      pages.push("…");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 py-4" aria-label="Pagination">
      {/* Prev */}
      {page > 1 ? (
        <Link href={href(page - 1)} className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
          ‹
        </Link>
      ) : (
        <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm text-gray-300 border border-gray-100">‹</span>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
              p === page
                ? "bg-gray-900 text-white"
                : "text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {page < totalPages ? (
        <Link href={href(page + 1)} className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
          ›
        </Link>
      ) : (
        <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm text-gray-300 border border-gray-100">›</span>
      )}
    </nav>
  );
}
