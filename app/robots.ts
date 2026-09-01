import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { routing } from "@/i18n/routing";

// Default locale first, so the emitted file reads /no before /en — the
// approved policy's exact line order. Derived from routing so a future
// locale's dashboard/admin cannot silently become crawlable.
const orderedLocales = [
  routing.defaultLocale,
  ...routing.locales.filter((l) => l !== routing.defaultLocale),
];

/**
 * Narrow by design: public crawling is generally allowed, and ONLY the
 * private/API prefixes are disallowed (each robots prefix rule covers the
 * route root itself and every descendant). Never add a surface here that
 * relies on meta noindex — /search, /login, /signup, /en/business/*, empty
 * categories and sorted variants MUST stay crawlable so the directive can be
 * read; robots-blocking them would leave them indexable-by-reference with
 * the noindex invisible. The dashboard/admin disallow is crawl hygiene only —
 * the middleware auth 307 remains the real security boundary. /_next/ stays
 * crawlable (Google must fetch JS/CSS to render).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/api/",
        ...["dashboard", "admin"].flatMap((path) =>
          orderedLocales.map((locale) => `/${locale}/${path}`),
        ),
      ],
    },
    // SITE_URL, never a hardcoded origin, so a preview deployment does not
    // advertise production's sitemap.
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
