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

/**
 * Report an <img> that will never paint, however late the browser decides it.
 *
 * Server-rendered pages put the <img> in the HTML, so the browser starts
 * loading it long before React hydrates. Two failures fall outside React's own
 * onError as a result, and both were seen live on this app:
 *
 *   Already failed by the time the component mounts. React does not replay the
 *   event, so the element is asked directly — finished (`complete`) with
 *   nothing decoded (`naturalWidth === 0`) is a load that failed.
 *
 *   Fails moments after mount, around the hydration boundary. A priority hero
 *   image was observed with React's onError attached and the event still never
 *   delivered. A native listener on the element does not depend on React's
 *   synthetic event delegation, so it catches what the handler misses.
 *
 * Call from a ref callback. The listener is `once`, so it needs no teardown.
 */
export function watchImageFailure(
  node: HTMLImageElement | null,
  onFailure: () => void
): void {
  if (!node) return;

  // An <img> that has not been given a source yet is ALSO `complete`, with
  // nothing decoded — by those two properties alone it is indistinguishable
  // from one that failed. next/image assigns src/srcSet in the same commit that
  // runs this ref, and the ref can win that race on a client navigation, so a
  // perfectly good cover was intermittently recorded as failed before it had
  // been asked to load anything. Only an element that actually has a source can
  // have failed at one.
  //
  // A source that arrives after this point is not lost: the element falls
  // through to the listeners below, and assigning src always ends in `load` or
  // `error` — from cache too — so a genuine failure still reports.
  const hasSource = !!(
    node.currentSrc ||
    node.getAttribute("src") ||
    node.getAttribute("srcset")
  );

  // `complete` means the browser is finished with this element one way or
  // another; nothing decoded alongside it means it has nothing to paint.
  if (node.complete && hasSource) {
    if (node.naturalWidth === 0) onFailure();
    return; // finished — there is nothing left to listen for
  }

  // Three different endings, because "failed" is not only `error`. A request
  // the browser cancels ends in `abort`, and a response that arrives but
  // decodes to nothing still fires `load` — both leave the same empty frame a
  // 404 does. Checking naturalWidth on load is what separates a real picture
  // from an element that merely finished.
  const fail = () => onFailure();
  node.addEventListener("error", fail, { once: true });
  node.addEventListener("abort", fail, { once: true });
  node.addEventListener(
    "load",
    () => {
      if (node.naturalWidth === 0) onFailure();
    },
    { once: true }
  );
}
