import type { Metadata } from "next";
import "./globals.css";

// Root not-found — the boundary Next uses for every URL that matches no route.
// That is most 404s in practice: a typo, a dead link, a stale bookmark. It
// includes locale-prefixed ones, so `/en/typo` is answered here, not by
// app/[locale]/not-found.tsx, which only ever handles an explicit `notFound()`
// call raised from inside the segment.
//
// It renders its own <html> and <body> because app/layout.tsx is a bare shell
// that renders neither, and nothing else wraps this page. Without them the
// response has no document element, the browser's parser invents one, and React
// then fails to reconcile against it — which is what left the 404 blank.
//
// It also sits outside NextIntlClientProvider and the session provider, so it
// cannot use next-intl or Header/Footer, and the copy below is fixed in the
// default locale. Given the paragraph above, that is a known gap rather than an
// edge case: an English visitor who mistypes a URL is answered in Norwegian,
// with a link to /en as the way out. Closing it needs a catch-all inside
// [locale] so these URLs match the segment — a routing change, not made here.
export const metadata: Metadata = {
  title: "Siden finnes ikke | DinLinks",
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return (
    <html lang="no">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <main className="min-h-screen flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md text-center">
            <a
              href="/no"
              className="inline-flex items-center gap-2 mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-lg"
            >
              <span className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                DL
              </span>
              <span className="text-lg font-bold text-gray-900">DinLinks</span>
            </a>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Siden finnes ikke
            </h1>

            <p className="mt-3 text-base text-gray-500 leading-relaxed">
              Siden du leter etter finnes ikke eller er flyttet.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-3">
              <a
                href="/no"
                className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                Gå til forsiden
              </a>

              <a
                href="/en"
                className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                English
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
