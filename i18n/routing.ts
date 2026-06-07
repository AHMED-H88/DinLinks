import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "no"],
  defaultLocale: "no",
  localePrefix: "always",
});

// Locale-aware Link, redirect, usePathname, useRouter
// Import these everywhere instead of next/navigation equivalents
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
