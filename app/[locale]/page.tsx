import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CategoryList from "@/components/CategoryList";
import BusinessCard from "@/components/BusinessCard";
import { mockCategories, mockBusinesses } from "@/lib/mock-data";

const featuredBusinesses = mockBusinesses.filter((b) => b.featured);

const stats = [
  { key: "statsBusinesses" as const, value: "12 000+" },
  { key: "statsVerified"   as const, value: "8 000+"  },
  { key: "statsUsers"      as const, value: "50 000+" },
];

const howItWorksKeys = [
  { step: "01", titleKey: "step1Title" as const, descKey: "step1Desc" as const },
  { step: "02", titleKey: "step2Title" as const, descKey: "step2Desc" as const },
  { step: "03", titleKey: "step3Title" as const, descKey: "step3Desc" as const },
];

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className="bg-gray-50 border-b border-gray-100 pt-20 pb-24 md:pt-28 md:pb-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold mb-8 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              {t("badge")}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
              {t("headline")}
              <span className="block text-primary-700">{t("headlineAccent")}</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              {t("subheadline")}
            </p>

            <SearchBar placeholder={t("searchPlaceholder")} />

            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {mockCategories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all duration-150 font-medium shadow-subtle"
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="border-b border-gray-100 bg-white py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
              {stats.map(({ key, value }) => (
                <div key={key}>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">{t(key)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured listings ── */}
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
              {featuredBusinesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  id={business.id}
                  name={business.name}
                  description={business.description}
                  category={business.category}
                  city={business.city}
                  verified={business.verified}
                  initials={business.initials}
                  phone={business.phone}
                  website={business.website}
                />
              ))}
            </div>

            <div className="text-center mt-10 sm:hidden">
              <Link href="/search" className="btn btn-outline btn-lg">
                {t("viewAllMobile")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="bg-gray-50 border-y border-gray-100 py-16 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-widest mb-2">
                {t("categoriesLabel")}
              </p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
                {t("categoriesTitle")}
              </h2>
              <p className="text-base text-gray-500 max-w-xl mx-auto">
                {t("categoriesSubtitle")}
              </p>
            </div>
            <CategoryList categories={mockCategories} />
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-widest mb-2">
                {t("howLabel")}
              </p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                {t("howTitle")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {howItWorksKeys.map(({ step, titleKey, descKey }) => (
                <div key={step}>
                  <div className="text-5xl font-black text-gray-100 leading-none mb-4 select-none">
                    {step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(titleKey)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA for businesses ── */}
        <section className="bg-primary-700 py-16 md:py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              {t("ctaTitle")}
            </h2>
            <p className="text-lg text-primary-200 mb-8 max-w-xl mx-auto leading-relaxed">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-700 font-semibold text-base hover:bg-primary-50 transition-colors shadow-medium"
              >
                {t("ctaRegister")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary-600 text-white font-medium text-base hover:bg-primary-500 transition-colors border border-primary-500"
              >
                {t("ctaLearnMore")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
