import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL, SITE_NAME, localeHreflang } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslations } from "next-intl";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "terms" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${params.locale}/terms`, languages: localeHreflang("/terms") },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      // Page-level openGraph replaces the layout's wholesale (shallow merge),
      // so og:locale must ride along or it disappears.
      locale: params.locale === "no" ? "nb_NO" : "en_GB",
      siteName: SITE_NAME,
      url: `${SITE_URL}/${params.locale}/terms`,
    },
  };
}

export default function TermsPage() {
  const t = useTranslations("terms");
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            {t("title")}
          </h1>
          {/* The revision date is static copy, not the current date. Rendering
              `new Date()` here made the terms claim they had been updated every
              day they were viewed, whether or not anything had changed. */}
          <p className="text-lg text-gray-600">
            {t("lastUpdated")} {t("lastUpdatedDate")}
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
              <a href="mailto:support@dinlinks.com" className="text-primary-600 hover:text-primary-700 font-medium">
                support@dinlinks.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
