import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL, SITE_NAME, localeHreflang } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslations } from "next-intl";

/** Bulleted sections, in document order, with how many items each renders. */
const LIST_SECTIONS = [
  { key: "dataCollection", items: 6, outro: false },
  { key: "dataUse",        items: 4, outro: false },
  { key: "dataSharing",    items: 5, outro: true  },
  { key: "retention",      items: 4, outro: true  },
  { key: "cookies",        items: 3, outro: true  },
  { key: "rights",         items: 7, outro: true  },
] as const;

/** Single-paragraph sections rendered between the lists, in document order. */
const TEXT_SECTIONS = ["transfers", "automated", "security"] as const;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${params.locale}/privacy`, languages: localeHreflang("/privacy") },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      // Page-level openGraph replaces the layout's wholesale (shallow merge),
      // so og:locale must ride along or it disappears.
      locale: params.locale === "no" ? "nb_NO" : "en_GB",
      siteName: SITE_NAME,
      url: `${SITE_URL}/${params.locale}/privacy`,
    },
  };
}

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  const Heading = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">{children}</h2>
  );

  const Bullets = ({ section, count }: { section: string; count: number }) => (
    <ul className="space-y-2 text-gray-600">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-primary-500 mt-1">•</span>
          <span>{t(`${section}.item${i + 1}` as never)}</span>
        </li>
      ))}
    </ul>
  );

  // Sections are interleaved: lists 1-2, then transfers, then lists 3-5,
  // then automated + security, then contact. Rendering them in one pass keeps
  // the order explicit rather than hidden in JSX nesting.
  const ordered = [
    LIST_SECTIONS[0], LIST_SECTIONS[1], LIST_SECTIONS[2],
    TEXT_SECTIONS[0],
    LIST_SECTIONS[3], LIST_SECTIONS[4], LIST_SECTIONS[5],
    TEXT_SECTIONS[1], TEXT_SECTIONS[2],
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            {t("title")}
          </h1>
          {/* The revision date is static copy, not the current date. Rendering
              `new Date()` here made the policy claim it had been updated every
              day it was viewed, whether or not anything had changed. */}
          <p className="text-lg text-gray-600">
            {t("lastUpdated")} {t("lastUpdatedDate")}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <Heading>{t("intro.heading")}</Heading>
            <p className="text-gray-600 leading-relaxed mb-4">{t("intro.p1")}</p>
            <p className="text-gray-600 leading-relaxed">{t("intro.p2")}</p>
          </section>

          {ordered.map((section) =>
            typeof section === "string" ? (
              <section key={section} className="mb-10">
                <Heading>{t(`${section}.heading` as never)}</Heading>
                <p className="text-gray-600 leading-relaxed">{t(`${section}.text` as never)}</p>
              </section>
            ) : (
              <section key={section.key} className="mb-10">
                <Heading>{t(`${section.key}.heading` as never)}</Heading>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t(`${section.key}.intro` as never)}
                </p>
                <Bullets section={section.key} count={section.items} />
                {section.outro && (
                  <p className="text-gray-600 leading-relaxed mt-4">
                    {t(`${section.key}.outro` as never)}
                  </p>
                )}
              </section>
            )
          )}

          <section className="mb-10">
            <Heading>{t("contact.heading")}</Heading>
            <p className="text-gray-600 leading-relaxed">
              {t("contact.text")}{" "}
              <a href="mailto:privacy@dinlinks.com" className="text-primary-600 hover:text-primary-700 font-medium">
                privacy@dinlinks.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
