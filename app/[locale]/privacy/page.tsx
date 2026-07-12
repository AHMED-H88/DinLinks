import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslations, useLocale } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("privacy");
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
              {t("intro.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t("intro.p1")}
            </p>
            <p className="text-gray-600 leading-relaxed">
              {t("intro.p2")}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("dataCollection.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t("dataCollection.intro")}
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("dataCollection.item1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("dataCollection.item2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("dataCollection.item3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("dataCollection.item4")}</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("dataUse.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t("dataUse.intro")}
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("dataUse.item1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("dataUse.item2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("dataUse.item3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("dataUse.item4")}</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("dataSharing.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("dataSharing.text")}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("rights.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t("rights.intro")}
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("rights.item1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("rights.item2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("rights.item3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{t("rights.item4")}</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("contact.heading")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("contact.text")}{" "}
              <a href="mailto:privacy@dinlinks.no" className="text-primary-600 hover:text-primary-700 font-medium">
                privacy@dinlinks.no
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
