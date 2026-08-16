"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

export type Locale = "en" | "no";

interface LanguageSwitcherProps {
  /** Compact label + plain buttons, used inside the mobile Header menu. */
  mobile?: boolean;
  /** Segmented control with no leading label, for the Account settings row. */
  bare?: boolean;
}

/**
 * The single locale switch for the whole product. Extracted from Header so the
 * Account page can offer language without a second localisation mechanism —
 * the mobile workspace hides the public Header, so this is the only way in.
 */
export default function LanguageSwitcher({ mobile = false, bare = false }: LanguageSwitcherProps) {
  const t        = useTranslations("nav");
  const pathname = usePathname();
  const router   = useRouter();

  // The active locale comes from next-intl itself, so the indicator always
  // matches the locale the page was actually rendered in — on the server and
  // on the client. (It previously read document.documentElement.lang inside a
  // useState initialiser, which is undefined during SSR and therefore always
  // fell back to "no", and never re-synced after navigation.)
  const current = useLocale() as Locale;

  function switchTo(locale: Locale) {
    if (locale === current) return;
    // The query string is read here, inside the click handler, rather than via
    // useSearchParams(). Reading it during render would opt every page that
    // renders the header out of static/ISR rendering; reading it on click has
    // no effect on rendering at all. usePathname() is locale-agnostic, so the
    // route is preserved and every existing search param carries over.
    const query = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${query}` as any, { locale });
  }

  if (mobile) {
    return (
      <div className="flex items-center gap-0.5">
        <span className="text-xs text-gray-400 font-medium tracking-widest uppercase mr-2">
          {t("language")}
        </span>
        <button
          onClick={() => switchTo("en")}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
            current === "en"
              ? "text-gray-900 bg-gray-100"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          EN
        </button>
        <span className="text-gray-300 text-xs select-none px-0.5">|</span>
        <button
          onClick={() => switchTo("no")}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
            current === "no"
              ? "text-gray-900 bg-gray-100"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          NO
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => switchTo("en")}
        className={`${bare ? "px-3 py-1.5" : "px-2.5 py-1"} text-xs font-semibold tracking-wide transition-all duration-150 ${
          current === "en"
            ? "bg-gray-900 text-white"
            : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
        }`}
      >
        EN
      </button>
      <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
      <button
        onClick={() => switchTo("no")}
        className={`${bare ? "px-3 py-1.5" : "px-2.5 py-1"} text-xs font-semibold tracking-wide transition-all duration-150 ${
          current === "no"
            ? "bg-gray-900 text-white"
            : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
        }`}
      >
        NO
      </button>
    </div>
  );
}
