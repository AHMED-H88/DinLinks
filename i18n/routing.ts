import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "no"],
  defaultLocale: "no",
  localePrefix: "always",
  // No automatic `Link: rel="alternate"; hreflang=...` response headers.
  // They fired on every routed response — including noindexed surfaces
  // (search, auth, demo profiles, empty categories) and 404s — and pointed
  // x-default at unprefixed URLs that only redirect. DinLinks needs
  // SELECTIVE hreflang driven by indexability, so page metadata
  // (alternates.languages via lib/site.ts localeHreflang) is the single
  // authoritative source. Locale detection and redirects are unaffected.
  alternateLinks: false,
});

// Locale-aware Link, redirect, usePathname, useRouter
// Import these everywhere instead of next/navigation equivalents
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
