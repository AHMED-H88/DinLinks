/**
 * Guards against next/image requests that can only fail (400/404).
 *
 * next/image rejects any remote host that is not listed in next.config.mjs
 * `images.remotePatterns`, and malformed values produce broken optimizer
 * requests. Stored URLs come from user uploads and older imports, so they are
 * validated at render time — valid images are never altered.
 */

/** Must stay in sync with `images.remotePatterns` in next.config.mjs. */
const ALLOWED_HOST_SUFFIXES = [
  ".supabase.co",
  "res.cloudinary.com",
  "images.unsplash.com",
];

/** Local fallback asset, always available and never optimised remotely. */
export const PLACEHOLDER_IMAGE = "/placeholder-business.svg";

/**
 * Return the URL when next/image can actually load it, otherwise null so the
 * caller can render its existing placeholder UI.
 *
 * Rejects: null/undefined, blank strings, malformed URLs, non-http(s) schemes
 * (data:, blob:, javascript:), and hosts missing from remotePatterns.
 * Accepts: root-relative local paths ("/foo.png") and allowed remote hosts.
 */
export function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Local asset served from /public
  if (trimmed.startsWith("/")) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null; // malformed
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  const host = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(suffix)
  );

  return allowed ? trimmed : null;
}
