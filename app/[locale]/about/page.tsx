import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("about");
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                {t("vision.heading")}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {t("vision.p1")}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t("vision.p2")}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-xl font-semibold text-primary-900">{t("tagline")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center tracking-tight">
              {t("why.heading")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-8">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("why.search.title")}
                </h3>
                <p className="text-gray-600">
                  {t("why.search.desc")}
                </p>
              </div>
              <div className="card p-8">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("why.platform.title")}
                </h3>
                <p className="text-gray-600">
                  {t("why.platform.desc")}
                </p>
              </div>
              <div className="card p-8">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("why.support.title")}
                </h3>
                <p className="text-gray-600">
                  {t("why.support.desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              {t("cta.heading")}
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search" className="btn btn-primary btn-lg">
                {t("cta.search")}
              </Link>
              <Link href="/signup" className="btn btn-outline btn-lg">
                {t("cta.register")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
