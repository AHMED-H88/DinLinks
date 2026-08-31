"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";

export type Locale = "en" | "no";

interface LanguageSwitcherProps {
  /** Compact label + plain links, used inside the mobile Header menu. */
  mobile?: boolean;
}

/**
 * The single locale switch for the whole product, rendered by Header on every
 * page including the mobile workspace. Kept as its own component so there is
 * exactly one locale-switching mechanism.
 *
 * Each choice is a real locale-aware <Link>, so the server-rendered HTML
 * carries an actual href to the same route in the other locale — a crawler
 * that runs no JavaScript can discover the alternate-locale URL, which the
 * old <button onClick> rendering never exposed. The click handler then takes
 * over for real users: it preserves the live query string, which the static
 * href cannot carry (reading the query via useSearchParams() during render
 * would opt every page that renders the Header out of static/ISR rendering,
 * so it is read inside the handler instead, where it costs nothing).
 */
export default function LanguageSwitcher({ mobile = false }: LanguageSwitcherProps) {
  const t        = useTranslations("nav");
  const pathname = usePathname();
  const router   = useRouter();

  // The active locale comes from next-intl itself, so the indicator always
  // matches the locale the page was actually rendered in — on the server and
  // on the client. (It previously read document.documentElement.lang inside a
  // useState initialiser, which is undefined during SSR and therefore always
  // fell back to "no", and never re-synced after navigation.)
  const current = useLocale() as Locale;

  function switchTo(event: React.MouseEvent, locale: Locale) {
    // Modified clicks (cmd/ctrl/shift/alt, middle button) fall through to the
    // real href so "open in new tab" works — something the old <button>
    // rendering could not offer at all. The query string is not carried on
    // that path; the href is the canonical route, which is the right landing.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    // For a plain click the href stays untouched for crawlers and JS-less
    // visitors; the enhanced navigation below preserves the current query
    // string and replaces (not pushes) history, exactly as the switch always
    // has.
    event.preventDefault();
    if (locale === current) return;
    const query = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${query}` as any, { locale });
  }

  if (mobile) {
    return (
      <div className="flex items-center gap-0.5">
        <span className="text-xs text-gray-400 font-medium tracking-widest uppercase mr-2">
          {t("language")}
        </span>
        <Link
          href={pathname}
          locale="en"
          onClick={(e) => switchTo(e, "en")}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
            current === "en"
              ? "text-gray-900 bg-gray-100"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          EN
        </Link>
        <span className="text-gray-300 text-xs select-none px-0.5">|</span>
        <Link
          href={pathname}
          locale="no"
          onClick={(e) => switchTo(e, "no")}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
            current === "no"
              ? "text-gray-900 bg-gray-100"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          NO
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
      <Link
        href={pathname}
        locale="en"
        onClick={(e) => switchTo(e, "en")}
        className={`px-2.5 py-1 text-xs font-semibold tracking-wide transition-all duration-150 ${
          current === "en"
            ? "bg-gray-900 text-white"
            : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
        }`}
      >
        EN
      </Link>
      <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
      <Link
        href={pathname}
        locale="no"
        onClick={(e) => switchTo(e, "no")}
        className={`px-2.5 py-1 text-xs font-semibold tracking-wide transition-all duration-150 ${
          current === "no"
            ? "bg-gray-900 text-white"
            : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
        }`}
      >
        NO
      </Link>
    </div>
  );
}
