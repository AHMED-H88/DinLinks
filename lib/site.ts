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

/** Matches exactly one shortId: 10 lowercase alphanumeric characters. */
const SHORT_ID_SEGMENT_RE = /^[a-z0-9]{10}$/;

/**
 * Deterministic lowercase-ASCII slug of a business name, for URL display only.
 *
 * Norwegian letters use the native ASCII convention (æ→ae ø→oe å→aa — the
 * folding style the taxonomy slugs already use); other diacritics reduce to
 * their base letter via NFD. Never persisted, and never applied to the
 * business name itself — this is URL encoding, not a copy edit.
 */
export function slugifyBusinessName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= 60) return slug;
  // Cap at 60 characters, cutting at a hyphen boundary when one exists.
  const cut = slug.slice(0, 60);
  const lastHyphen = cut.lastIndexOf("-");
  return (lastHyphen > 0 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, "");
}

/**
 * The shortId a /business/ route param claims, or null.
 *
 * Accepts the canonical `{slug}-{shortId}` form (any slug prefix, current or
 * stale) and the bare `{shortId}` compatibility form. A legacy cuid (25 chars,
 * no hyphen) and the demo ids (`demo-ror-og-bad` — trailing token not 10
 * chars) match neither and fall through to exact-id resolution. A 10-char
 * name fragment can match — it then simply misses the shortId lookup, so the
 * safety guarantee is exact-key lookup + fallthrough, not this pattern alone.
 */
export function shortIdFromBusinessRouteParam(param: string): string | null {
  if (SHORT_ID_SEGMENT_RE.test(param)) return param;
  const lastHyphen = param.lastIndexOf("-");
  if (lastHyphen === -1) return null;
  const tail = param.slice(lastHyphen + 1);
  return SHORT_ID_SEGMENT_RE.test(tail) ? tail : null;
}

/**
 * The path segment identifying one business under /business/.
 *
 * Single source of truth for the public business URL shape — every link,
 * canonical, Open Graph URL and structured-data URL must go through this (via
 * businessPath/businessUrl) so the shape can only ever change in one place.
 *
 * - Real business with a shortId: `{slug-of-current-name}-{shortId}`, or the
 *   bare shortId when the name yields no slug (the only case where the bare
 *   form is canonical).
 * - Demo profile: always its id — outreach links must stay byte-stable, and
 *   demos are noindexed so readable URLs buy nothing.
 * - Row without a shortId (pre-backfill or partial data): its id, which the
 *   profile route resolves and permanently redirects to the canonical form.
 */
export function businessUrlSegment(b: BusinessUrlParts): string {
  if (b.isDemo || !b.shortId) return b.id;
  const slug = slugifyBusinessName(b.name ?? "");
  return slug ? `${slug}-${b.shortId}` : b.shortId;
}

/** Locale-less path for the locale-aware <Link> from @/i18n/routing. */
export function businessPath(b: BusinessUrlParts): string {
  return `/business/${businessUrlSegment(b)}`;
}

/** The absolute, locale-prefixed address of a business profile. */
export function businessUrl(locale: string, b: BusinessUrlParts): string {
  return `${SITE_URL}/${locale}${businessPath(b)}`;
}
