/**
 * The public web origin of DinLinks — the one every canonical URL, Open Graph
 * tag, structured-data URL and share link is built from.
 *
 * This exists because those URLs were previously derived from `NEXTAUTH_URL`,
 * which is an authentication setting: it tells Auth.js where to send callbacks,
 * and it is not required to be the address visitors actually browse. The two
 * had drifted apart, so production pages were publishing `https://dinlinks.no`
 * as their canonical while the site itself served from `www.dinlinks.com` —
 * telling search engines the canonical copy lives somewhere it does not.
 *
 * `NEXT_PUBLIC_SITE_URL` is read first so the origin can be set per
 * environment, and the fallback is the real production origin rather than a
 * redirecting alias. `NEXTAUTH_URL` is deliberately not consulted: keeping the
 * two apart is the point.
 */
const FALLBACK_SITE_URL = "https://www.dinlinks.com";

/** No trailing slash, so `${SITE_URL}/${locale}/...` never doubles it. */
function normalize(origin: string): string {
  return origin.replace(/\/+$/, "");
}

export const SITE_URL = normalize(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL
);

export const SITE_NAME = "DinLinks";

/** The public, locale-aware address of a business profile. */
export function businessUrl(locale: string, id: string): string {
  return `${SITE_URL}/${locale}/business/${id}`;
}
