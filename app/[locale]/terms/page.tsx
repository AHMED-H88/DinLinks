import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslations, useLocale } from "next-intl";

export default function TermsPage() {
  const t = useTranslations("terms");
  const locale = useLocale();
  const dateLocale = locale === "no" ? "nb-NO" : "en-GB";
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("lastUpdated")} {new Date().toLocaleDateString(dateLocale)}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("acceptance.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("acceptance.text")}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("usage.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t("usage.p1")}
            </p>
            <p className="text-gray-600 leading-relaxed">
              {t("usage.p2")}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("accounts.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t("accounts.intro")}
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("accounts.item1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("accounts.item2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("accounts.item3")}</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("profiles.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t("profiles.intro")}
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("profiles.item1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("profiles.item2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("profiles.item3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("profiles.item4")}</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("ip.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("ip.text")}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("disclaimer.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("disclaimer.text")}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("liability.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("liability.text")}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("changes.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("changes.text")}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("contact.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("contact.text")}{" "}
              <a href="mailto:support@dinlinks.no" className="text-primary-600 hover:text-primary-700 font-medium">
                support@dinlinks.no
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
