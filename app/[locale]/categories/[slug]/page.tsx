import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLIC_DISCOVERY_WHERE } from "@/lib/discovery";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import CategorySortBar from "@/components/CategorySortBar";
import SubcategoryChips from "@/components/SubcategoryChips";
import { subOrder } from "@/lib/taxonomy-v1";
import { businessUrl, SITE_URL, SITE_NAME, localeHreflang } from "@/lib/site";
import { safeJsonLdString } from "@/lib/jsonld";
import { buildCategoryItemListJsonLd } from "@/lib/structured-data";
import {
  parseCategoryListingQuery,
  categoryTargetIds,
  CATEGORY_PAGE_SIZE,
  type CategorySort,
  type RawSearchParams,
} from "@/lib/category-listing";

// No `force-dynamic`: this page reads `searchParams` (sort / page), which
// already forces dynamic rendering. The flag was redundant.

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: RawSearchParams;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "categoryPage" });
  const tCat = await getTranslations({ locale, namespace: "categories" });

  // The exact same parser the renderer uses — metadata and page can never
  // disagree about what this URL means. Invalid → the renderer hard-404s.
  const listing = parseCategoryListingQuery(searchParams);
  if (!listing) return { title: t("metaNotFound") };

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, children: { select: { id: true } } },
  });
  if (!category) return { title: t("metaNotFound") };

  // Top-level Category counts span its Subcategories; a leaf counts its own.
  const targetIds = categoryTargetIds(category);
  const count = await prisma.business.count({
    where: { categoryId: { in: targetIds }, ...PUBLIC_DISCOVERY_WHERE },
  });

  const catName = tCat.has(category.slug) ? tCat(category.slug) : category.name;

  const isEmpty = count === 0;

  // The renderer hard-404s beyond the real range; the 404 response's head
  // must not assert a self-canonical and hreflang pair for a page that does
  // not exist, so metadata collapses to the not-found title on the same
  // range rule.
  if (listing.page > 1 && listing.page > Math.ceil(count / CATEGORY_PAGE_SIZE)) {
    return { title: t("metaNotFound") };
  }

  const path = `/categories/${slug}${listing.canonicalSearch}`;

  return {
    title: t("metaTitle", { category: catName }),
    // An empty category must not advertise "0 businesses" as its SERP
    // snippet; the count-free line describes the page without a number.
    description: isEmpty
      ? t("metaDescriptionEmpty", { category: catName.toLowerCase() })
      : t("metaDescription", { count, category: catName.toLowerCase() }),
    // Approved D6: permanent taxonomy URLs stay reachable, but an empty
    // category is thin near-duplicate inventory — noindex while empty, and
    // this same live count flips it back to indexable automatically when a
    // qualifying business arrives. follow keeps breadcrumb and chip links
    // passing signal. The count above uses this page's own targetIds
    // aggregation (children-if-any-else-self + PUBLIC_DISCOVERY_WHERE) — the
    // one source that cannot classify a populated top level as empty.
    //
    // Alternative orderings (?sort=reviewed/newest/alpha) are noindexed
    // reorderings of the same collection, per Google's guidance against
    // indexing alternative sort URLs — users keep them, the index does not.
    ...(isEmpty || listing.isSorted ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: t("ogTitle", { category: catName }),
      description: isEmpty
        ? t("ogDescriptionEmpty", { category: catName.toLowerCase() })
        : t("ogDescription", { count, category: catName.toLowerCase() }),
      type: "website",
      // Shallow metadata merge drops the layout og:locale unless restated.
      locale: locale === "no" ? "nb_NO" : "en_GB",
      siteName: SITE_NAME,
      // og:url follows the canonical target — the default-sort form of this
      // page number — so sorted variants advertise their canonical, and page
      // 2+ advertises itself rather than page 1.
      url: `${SITE_URL}/${locale}${path}`,
    },
    alternates: {
      // Page 2+ self-canonicalizes (?page=N, default-sort form); page 1 is
      // the bare URL. Sorted variants canonicalize to the same default-sort
      // page target instead of being indexed as duplicate orderings.
      canonical: `/${locale}${path}`,
      // hreflang only between mutually indexable pair members: not for empty
      // categories (D6 noindex) and not for noindexed sorted variants. Page
      // 2 pairs with page 2 — same page number in both locales, never page 1.
      ...(isEmpty || listing.isSorted ? {} : { languages: localeHreflang(path) }),
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avgRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

// Every ordering carries the immutable unique id as a secondary key: the
// primary keys all admit ties (equal views, counts, timestamps, names), and
// Postgres gives tied rows no stable order — without the tie-breaker a
// business could appear on two pages or on none.
function buildOrderBy(sort: CategorySort) {
  switch (sort) {
    case "reviewed": return [{ reviews:   { _count: "desc" as const } }, { id: "asc" as const }];
    case "newest":   return [{ createdAt: "desc" as const },             { id: "asc" as const }];
    case "alpha":    return [{ name:      "asc"  as const },             { id: "asc" as const }];
    case "popular":  return [{ views:     "desc" as const },             { id: "asc" as const }];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  // `locale` was always present at runtime — this route lives under
  // app/[locale] — it simply was not declared, which is why the JSON-LD item
  // URLs below used to hard-code "/en/" for Norwegian visitors too.
  params: Promise<{ slug: string; locale: string }>;
  searchParams: RawSearchParams;
}) {
  const { slug, locale } = await params;
  const t         = await getTranslations("categoryPage");
  const tCat      = await getTranslations("categories");

  // One authoritative parse — invalid page/sort syntax is a hard 404, never
  // a silent page 1; valid-but-noncanonical forms (?page=1, ?page=01,
  // ?sort=popular) permanently redirect ONCE to the canonical form, with
  // unrelated (campaign) parameters preserved across the hop.
  const listing = parseCategoryListingQuery(searchParams);
  if (!listing) notFound();
  if (listing.redirectSearch !== null) {
    permanentRedirect(`/${locale}/categories/${slug}${listing.redirectSearch}`);
  }
  const { page, sort, isSorted } = listing;

  const category = await prisma.category.findUnique({
    where: { slug },
    // Explicit select (no broad implicit select) + children for the two-level view.
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      children: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!category) notFound();

  const catName = tCat.has(category.slug) ? tCat(category.slug) : category.name;

  // A top-level Category shows businesses across its Subcategories; a leaf (a
  // Subcategory, or a not-yet-migrated flat row) shows its own businesses.
  const isTopLevel = category.parentId === null && category.children.length > 0;
  const targetIds = categoryTargetIds(category);
  const subcategories = [...category.children]
    .map((c) => ({ id: c.id, name: tCat.has(c.slug) ? tCat(c.slug) : c.name, slug: c.slug }))
    .sort((a, b) => subOrder(a.slug) - subOrder(b.slug));

  // The count runs BEFORE the page-slice query so an out-of-range page is
  // a hard 404 without a huge `skip` ever reaching Prisma.
  const [total, populatedChildren] = await Promise.all([
    prisma.business.count({ where: { categoryId: { in: targetIds }, ...PUBLIC_DISCOVERY_WHERE } }),

    // Which Subcategories actually hold discoverable businesses. The Taxonomy
    // Master List permits hiding empty Subcategories from public result
    // pages; a chip to an empty (noindexed) page helps neither users nor
    // crawlers. Distinct on categoryId — existence is all that matters here.
    category.children.length > 0
      ? prisma.business.findMany({
          where:    { categoryId: { in: category.children.map((c) => c.id) }, ...PUBLIC_DISCOVERY_WHERE },
          distinct: ["categoryId"],
          select:   { categoryId: true },
        })
      : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / CATEGORY_PAGE_SIZE);

  // Beyond the real range → hard 404. Page 1 stays reachable even at zero
  // inventory: the D6 empty-category page is a valid (noindexed) URL, but
  // ?page=2 on it is not a category state — it is an invalid pagination URL.
  if (page > 1 && page > totalPages) notFound();

  const businesses = await prisma.business.findMany({
    where:   { categoryId: { in: targetIds }, ...PUBLIC_DISCOVERY_WHERE },
    include: {
      // The business's own (sub)category, so a card on a top-level Category
      // page shows the specific Subcategory (e.g. "Frisør") rather than
      // repeating the parent Category ("Tjenester").
      category: { select: { name: true, slug: true } },
      reviews:  { select: { rating: true } },
      _count:   { select: { branches: true } },
    },
    orderBy: buildOrderBy(sort),
    skip:  (page - 1) * CATEGORY_PAGE_SIZE,
    take:  CATEGORY_PAGE_SIZE,
  });

  // Chips render only Subcategories that hold at least one discoverable
  // business (Taxonomy Master List permits hiding empty ones). targetIds
  // above deliberately keeps ALL children — hiding a chip must never shrink
  // the page's own business list or counts.
  const populatedChildIds = new Set(populatedChildren.map((b) => b.categoryId));
  const visibleSubcategories = subcategories.filter((sc) => populatedChildIds.has(sc.id));

  // ── JSON-LD (ItemList of businesses) ─────────────────────────────────────
  // The name is the localized page title so the markup language matches the
  // visible page. Approved pagination policy: each indexable default-sort
  // page owns a page-scoped ItemList — only the entities rendered here,
  // positions starting at 1. Noindexed sorted variants emit none, matching
  // their robots policy; zero items emit none.
  const itemListJsonLd = isSorted
    ? null
    : buildCategoryItemListJsonLd({
        name:  t("metaTitle", { category: catName }),
        items: businesses.map((b) => ({ name: b.name, url: businessUrl(locale, b) })),
      });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* JSON-LD — absent when there is nothing truthful to list. */}
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdString(itemListJsonLd) }}
        />
      )}

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
                {/* Count only. This page has no city filter — it lists every
                    approved business in the category, in every city — so the
                    city suffix that used to sit here described nothing the
                    reader could act on. With one distinct city among the
                    results it read as a scope ("2 bedrifter · Bergen") that the
                    result set did not actually have, and a business whose city
                    is unset was left out of the summary entirely while still
                    being counted. The city belongs to each card, and to Search,
                    where an explicit filter backs it. */}
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium text-gray-700">{total}</span>{" "}
                  {total === 1 ? t("businessSingular") : t("businessPlural")}
                </p>
              </div>

              {/* Sort bar — only meaningful with 2+ results to reorder. */}
              {total >= 2 && (
                <div className="sm:ml-auto">
                  <CategorySortBar currentSort={sort} slug={slug} />
                </div>
              )}
            </div>

            {/* Subcategories — shown for a top-level Category so its two-level
                structure is clear. Never renders Subcategories as top-level.
                Desktop shows all; mobile shows the first four with Vis alle. */}
            {isTopLevel && visibleSubcategories.length > 0 && (
              <SubcategoryChips subcategories={visibleSubcategories} />
            )}
          </div>
        </section>

        {/* Grid */}
        <section className="py-10 px-4">
          <div className="max-w-7xl mx-auto">
            {businesses.length === 0 ? (
              <EmptyCategory />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
                  {businesses.map((b) => (
                    <BusinessCard
                      key={b.id}
                      id={b.id}
                      shortId={b.shortId}
                      name={b.name ?? ""}
                      description={b.description ?? ""}
                      category={b.category?.name ?? catName}
                      categorySlug={b.category?.slug ?? category.slug}
                      city={b.city ?? ""}
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

function EmptyCategory() {
  const t = useTranslations("categoryPage");
  return (
    <div className="text-center py-20">
      <h3 className="text-base font-semibold text-gray-900 mb-2">
        {t("noBusinesses")}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        {t("beFirst")}
      </p>
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
