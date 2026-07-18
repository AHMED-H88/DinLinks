import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import BusinessCard from "@/components/BusinessCard";
import { prisma } from "@/lib/prisma";
import { getCategoriesWithCounts } from "@/lib/cached-data";

// Was `force-dynamic`. Nothing on this page is user-specific — the session is
// read client-side in <Header> — so it is safe to render on an interval
// instead of on every request.
export const revalidate = 300; // 5 minutes

// ─── Why DinLinks value props ─────────────────────────────────────────────────
const whyItems = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    ),
    titleKey: "feature1Title",
    descKey: "feature1Desc",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    titleKey: "feature2Title",
    descKey: "feature2Desc",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    ),
    titleKey: "feature3Title",
    descKey: "feature3Desc",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    ),
    titleKey: "feature4Title",
    descKey: "feature4Desc",
  },
];

export default async function HomePage() {
  const t = await getTranslations("home");
  const tCat = await getTranslations("categories");

  // Real data from Supabase
  const [categories, featuredBusinesses, businessCount, approvedCount] = await Promise.all([
    getCategoriesWithCounts(),
    prisma.business.findMany({
      where: { status: "APPROVED" },
      orderBy: { views: "desc" },
      take: 6,
      include: { category: true, reviews: { select: { rating: true } }, _count: { select: { branches: true } } },
    }),
    prisma.business.count(),
    prisma.business.count({ where: { status: "APPROVED" } }),
  ]);

  // Items 1 & 2 are real Supabase counts (no "+" — the number is exact).
  // Item 3 is a non-numerical trust statement, not a fabricated metric.
  const stats = [
    { value: businessCount.toLocaleString(),  label: t("statsBusinesses") },
    { value: approvedCount.toLocaleString(),  label: t("statsVerified") },
    { value: t("statsFreeTitle"),             label: t("statsFreeSubtitle") },
  ];

  const categoriesWithCount = categories.map((c) => ({
    id: c.id,
    name: tCat.has(c.slug) ? tCat(c.slug) : c.name,
    slug: c.slug,
    count: c.count,
  }));

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 pt-20 pb-24 md:pt-28 md:pb-32 px-4 overflow-hidden">
          {/* Subtle background rings */}
          <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full border border-primary-100 opacity-40" />
            <div className="absolute w-[900px] h-[900px] rounded-full border border-primary-50 opacity-30" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold mb-8 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              {t("badge")}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold text-gray-900 mb-5 tracking-tight leading-tight">
              {t("heroTitle")}
              <span className="block text-primary-700">{t("heroTitleAccent")}</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              {t("subheadline")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link
                href="/search"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-base hover:bg-gray-800 active:scale-[0.98] transition-all shadow-medium"
              >
                {t("exploreBusinesses")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-gray-700 font-semibold text-base border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-subtle"
              >
                {t("listYourBusiness")}
              </Link>
            </div>

            {/* Search */}
            <SearchBar placeholder={t("searchPlaceholder")} />

            {/* Category pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {categoriesWithCount.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all duration-150 font-medium shadow-subtle"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 bg-white py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-4 sm:gap-12 text-center">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured businesses ───────────────────────────────────────────── */}
        {featuredBusinesses.length > 0 && (
          <section className="py-16 md:py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-xs font-semibold text-primary-700 uppercase tracking-widest mb-2">
                    {t("featuredLabel")}
                  </p>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {t("featuredTitle")}
                  </h2>
                </div>
                <Link
                  href="/search"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
                >
                  {t("viewAll")}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredBusinesses.map((b) => {
                  const rating = b.reviews.length
                    ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length
                    : null;
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
                    />
                  );
                })}
              </div>
              <div className="text-center mt-10 sm:hidden">
                <Link href="/search" className="btn btn-outline btn-lg">{t("viewAllMobile")}</Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Popular categories ────────────────────────────────────────────── */}
        <section className="bg-gray-50 border-y border-gray-100 py-16 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-widest mb-2">
                {t("categoriesLabel")}
              </p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
                {t("categoriesTitle")}
              </h2>
              <p className="text-base text-gray-500 max-w-xl mx-auto">{t("categoriesSubtitle")}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {categoriesWithCount.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="card card-hover p-5 text-center group flex flex-col items-center gap-2"
                >
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-400">{cat.count} {cat.count === 1 ? t("businessSingular") : t("businessPlural")}</p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
              >
                {t("browseAllCategories")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-widest mb-2">
                {t("howLabel")}
              </p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t("howTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {(["1","2","3"] as const).map((n, i) => (
                <div key={n} className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary-700 text-white text-sm font-bold flex items-center justify-center mb-5 shadow-soft">
                    {n}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t(`step${n}Title` as any)}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(`step${n}Desc` as any)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why DinLinks ──────────────────────────────────────────────────── */}
        <section className="bg-gray-50 border-y border-gray-100 py-16 md:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-widest mb-2">
                {t("whyLabel")}
              </p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                {t("whyTitle")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyItems.map((item) => (
                <div key={item.titleKey} className="card p-6 flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t(item.titleKey as any)}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{t(item.descKey as any)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── For business owners ───────────────────────────────────────────── */}
        <section className="bg-gray-900 py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3">
                  {t("forOwners")}
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                  {t("ctaTitle")}
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">{t("ctaSubtitle")}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 active:scale-[0.98] transition-all"
                  >
                    {t("ctaRegister")}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-gray-700 text-gray-300 font-medium text-sm hover:border-gray-500 hover:text-white transition-all"
                  >
                    {t("ctaLearnMore")}
                  </Link>
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-4">
                {(["1", "2", "3", "4", "5"] as const).map((n) => (
                  <div key={n} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300 text-sm">{t(`ownerBenefit${n}` as any)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
