import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL, SITE_NAME, localeHreflang } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslations } from "next-intl";

/**
 * The addresses that actually reach someone, in the order a visitor is most
 * likely to need them. Each key maps to `contact.info.<key>Label` and
 * `contact.info.<key>Desc` in the message files.
 */
const CHANNELS = [
  { key: "general",  address: "hello@dinlinks.com" },
  { key: "support",  address: "support@dinlinks.com" },
  { key: "privacy",  address: "privacy@dinlinks.com" },
  { key: "security", address: "security@dinlinks.com" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${params.locale}/contact`, languages: localeHreflang("/contact") },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      // Page-level openGraph replaces the layout's wholesale (shallow merge),
      // so og:locale must ride along or it disappears.
      locale: params.locale === "no" ? "nb_NO" : "en_GB",
      siteName: SITE_NAME,
      url: `${SITE_URL}/${params.locale}/contact`,
    },
  };
}

export default function ContactPage() {
  const t = useTranslations("contact");
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

        {/* Contact channels — email only.
            This section previously carried a message form with no action, no
            onSubmit and no API behind it, so submitting it sent nothing. The
            page now states the addresses that actually reach someone rather
            than offering a channel that does not work. */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              {t("info.heading")}
            </h2>
            <p className="text-gray-600 mb-10 leading-relaxed">
              {t("info.intro")}
            </p>

            <div className="space-y-6">
              {CHANNELS.map(({ key, address }) => (
                <div key={key} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{t(`info.${key}Label`)}</h3>
                    <a
                      href={`mailto:${address}`}
                      className="text-primary-600 hover:text-primary-700 transition-colors break-all"
                    >
                      {address}
                    </a>
                    <p className="text-gray-600 mt-1">{t(`info.${key}Desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center tracking-tight">
              {t("faq.heading")}
            </h2>
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("faq.q1")}
                </h3>
                <p className="text-gray-600">
                  {t("faq.a1")}
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("faq.q2")}
                </h3>
                <p className="text-gray-600">
                  {t("faq.a2")}
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("faq.q3")}
                </h3>
                <p className="text-gray-600">
                  {t("faq.a3")}
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("faq.q4")}
                </h3>
                <p className="text-gray-600">
                  {t("faq.a4")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
