import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL, SITE_NAME, localeHreflang } from "@/lib/site";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import BusinessCard from "@/components/BusinessCard";
import { prisma } from "@/lib/prisma";
import { PUBLIC_DISCOVERY_WHERE } from "@/lib/discovery";
import { getTopLevelCategories } from "@/lib/cached-data";
import { HOMEPAGE_SHORTCUT_SLUGS } from "@/lib/taxonomy-v1";

// Was `force-dynamic`. Nothing on this page is user-specific — the session is
// read client-side in <Header> — so it is safe to render on an interval
// instead of on every request.
export const revalidate = 300; // 5 minutes

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "layout" });
  return {
    // The homepage owns the brand identity the root layout uses as its
    // fallback. `absolute` keeps the "%s | DinLinks" template from doubling
    // the name; the strings are the existing approved layout copy.
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: { canonical: `/${params.locale}`, languages: localeHreflang("") },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      // Page-level openGraph replaces the layout's wholesale (shallow merge),
      // so og:locale must ride along or it disappears.
      locale: params.locale === "no" ? "nb_NO" : "en_GB",
      siteName: SITE_NAME,
      // The locale homepage itself — not the bare origin, which redirects.
      url: `${SITE_URL}/${params.locale}`,
    },
  };
}

// Three equal information cards — no decorative icons.
const trustItems = [
  { titleKey: "trust1Title", textKey: "trust1Text" },
  { titleKey: "trust2Title", textKey: "trust2Text" },
  { titleKey: "trust3Title", textKey: "trust3Text" },
];

export default async function HomePage() {
  const t = await getTranslations("home");
  const tCat = await getTranslations("categories");

  // Real data from Supabase
  const [categories, featuredBusinesses] = await Promise.all([
    // Top-level Categories only (parentId = null), in approved Taxonomy v1 order.
    getTopLevelCategories(),
    prisma.business.findMany({
      where: PUBLIC_DISCOVERY_WHERE,
      orderBy: { views: "desc" },
      take: 6,
      include: { category: true, reviews: { select: { rating: true } }, _count: { select: { branches: true } } },
    }),
  ]);

  const categoriesWithCount = categories.map((c) => ({
    id: c.id,
    name: tCat.has(c.slug) ? tCat(c.slug) : c.name,
    slug: c.slug,
    count: c.count,
  }));

  // Homepage shortcuts: the approved top-level shortcut slugs that actually
  // exist as rows, in approved order. Before the taxonomy data migration some
  // (e.g. mat, bil) may not exist yet — we simply show fewer; we never
  // fabricate category rows in code.
  const shortcutCategories = HOMEPAGE_SHORTCUT_SLUGS
    .map((slug) => categoriesWithCount.find((c) => c.slug === slug))
    .filter((c): c is (typeof categoriesWithCount)[number] => Boolean(c));

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 pt-20 pb-24 md:pt-28 md:pb-32 px-4">
          <div className="relative max-w-4xl mx-auto text-center">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold text-gray-900 mb-5 tracking-tight leading-tight">
              {t("heroTitle")}
            </h1>

            {/* Supporting text — slightly stronger contrast */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              {t("subheadline")}
            </p>

            {/* Search — the primary action and strongest visual element */}
            <SearchBar placeholder={t("searchPlaceholder")} />

            {/*
              Homepage category shortcuts — TOP-LEVEL Categories only, in the
              approved Taxonomy v1 order (Mat, Shopping, Tjenester, Helse, Bil,
              Administrasjon). Subcategories (Restaurant, Kafe, Håndverk, …) must
              never appear here. Rows come from the database; before the taxonomy
              data migration some top-levels may be missing, so we render fewer
              shortcuts rather than fabricate category rows.
            */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {shortcutCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150 shadow-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* View all categories — opens the full Categories page (all eight top-level Categories) */}
            <div className="mt-5">
              <Link
                href="/categories"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm"
              >
                {t("viewAllCategories")}
              </Link>
            </div>

            {/* Register Business — quiet secondary action, never competes with search */}
            <div className="mt-8">
              <Link
                href="/signup"
                className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm"
              >
                {t("listYourBusiness")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Trust cards (three equal, no business counts) ─────────────────── */}
        <section className="border-b border-gray-100 bg-white py-12 md:py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {trustItems.map((item) => (
                <div key={item.titleKey} className="card p-6 flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-gray-900">{t(item.titleKey)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(item.textKey)}</p>
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
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {t("featuredTitle")}
                  </h2>
                </div>
                <Link
                  href="/search"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
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
                      shortId={b.shortId}
                      name={b.name ?? ""}
                      description={b.description ?? ""}
                      category={b.category?.name ?? ""}
                      categorySlug={b.category?.slug}
                      city={b.city ?? ""}
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
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-400">{cat.count} {cat.count === 1 ? t("businessSingular") : t("businessPlural")}</p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
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
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t("howTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {(["1","2","3"] as const).map((n, i) => (
                <div key={n} className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center mb-5 shadow-soft">
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

        {/* ── For business owners ───────────────────────────────────────────── */}
        <section className="bg-gray-900 py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                  {t("ctaTitle")}
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">{t("ctaSubtitle")}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 active:scale-[0.98] transition-all"
                  >
                    {t("ctaRegister")}
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
              <div className="space-y-3">
                {(["1", "2", "3", "4", "5"] as const).map((n) => (
                  <p key={n} className="text-gray-300 text-sm leading-relaxed">
                    {t(`ownerBenefit${n}` as any)}
                  </p>
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
