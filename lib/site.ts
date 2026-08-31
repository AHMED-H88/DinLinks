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

/**
 * The fields a business URL is built from.
 *
 * Only `id` is required: any call site that cannot supply the others still
 * produces a working URL (the legacy id form, which the profile route resolves
 * and permanently redirects to the canonical form). `shortId` and `isDemo`
 * exist on every full Business row; `name` feeds the readable slug.
 */
export type BusinessUrlParts = {
  id: string;
  name?: string | null;
  shortId?: string | null;
  isDemo?: boolean;
};

/**
 * The path segment identifying one business under /business/.
 *
 * Single source of truth for the public business URL shape — every link,
 * canonical, Open Graph URL and structured-data URL must go through this (via
 * businessPath/businessUrl) so the shape can only ever change in one place.
 */
export function businessUrlSegment(b: BusinessUrlParts): string {
  return b.id;
}

/** Locale-less path for the locale-aware <Link> from @/i18n/routing. */
export function businessPath(b: BusinessUrlParts): string {
  return `/business/${businessUrlSegment(b)}`;
}

/** The absolute, locale-prefixed address of a business profile. */
export function businessUrl(locale: string, b: BusinessUrlParts): string {
  return `${SITE_URL}/${locale}${businessPath(b)}`;
}
