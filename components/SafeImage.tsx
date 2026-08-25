"use client";

import { useCallback, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { safeImageUrl, watchImageFailure } from "@/lib/images";

/**
 * A business image that is never allowed to render as a broken-image icon.
 *
 * Stored image URLs come from uploads and older imports, and they fail in two
 * different ways that need two different guards:
 *
 *   Before the request — `safeImageUrl` rejects a blank value, a malformed
 *   URL, a non-http(s) scheme and any host missing from `images.remotePatterns`.
 *   next/image would answer all of those with a 400 from the optimizer, so no
 *   request is worth making.
 *
 *   After the request — a perfectly valid URL on an allowed host can still 404,
 *   time out, or point at a file that has since been deleted. Only the browser
 *   finds that out, so the failure is caught with `onError`.
 *
 * Either way the caller's own `fallback` is what renders. This component owns
 * no visual style of its own: every call site keeps the neutral placeholder it
 * already had (a gradient band, a pair of initials), and simply passes it in.
 *
 * A client component because `onError` needs a browser. It is safe to use from
 * a Server Component — `fallback` is ordinary JSX passed as a prop.
 */
type SafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string | null | undefined;
  /** Rendered whenever the image is missing, unusable, or fails to load. */
  fallback: React.ReactNode;
};

// `alt` is pulled out of the spread and passed by name. It is required by
// ImageProps either way, but jsx-a11y cannot see through `{...rest}` and reads
// the spread as an <Image> with no alt at all.
export default function SafeImage({ src, alt, fallback, ...imageProps }: SafeImageProps) {
  // The URL that failed, rather than a boolean: a card can be handed a new src
  // (a re-render, a list that reorders) and that one deserves its own attempt
  // instead of inheriting the previous URL's failure.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const validated = safeImageUrl(src);

  // Everything about *when* a load failure becomes observable lives in
  // watchImageFailure — React's onError alone misses failures that land around
  // the hydration boundary. ProfileGallery uses the same helper.
  const watchForFailure = useCallback(
    (node: HTMLImageElement | null) =>
      watchImageFailure(node, () => {
        if (validated) setFailedSrc(validated);
      }),
    [validated]
  );

  if (!validated || validated === failedSrc) return <>{fallback}</>;

  return (
    <Image
      {...imageProps}
      src={validated}
      alt={alt}
      ref={watchForFailure}
      // Kept as the ordinary path for a failure that lands well after mount.
      onError={() => setFailedSrc(validated)}
    />
  );
}
