import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

// Not-found boundary for an explicit `notFound()` raised inside the [locale]
// segment: a missing or unapproved business, an unknown category slug. It does
// NOT catch unmatched URLs — a typo such as `/no/typo` matches no route at all
// and is answered by the root app/not-found.tsx instead.
//
// What it fixes: without a boundary here the unwind reached the root layout,
// which renders no <html> or <body>, and the response carried no document
// element — the blank page.
//
// Worth knowing before editing this file: the server still emits Next's
// `__next_error__` shell with an empty <body> for these routes, and this
// component is applied during hydration, which is where the markup, Header,
// Footer and translations actually appear. The fix is real but client-side, so
// a visitor with JavaScript disabled still sees nothing. Server-rendering it
// would mean changing how the root layout builds the document, which is out of
// scope by decision.
export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t("title")}
          </h1>

          <p className="mt-3 text-base text-gray-500 leading-relaxed">
            {t("body")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              {t("goHome")}
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              {t("findBusiness")}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
