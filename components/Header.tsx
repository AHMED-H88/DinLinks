"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";

// ─── Language switcher ────────────────────────────────────────────────────────

type Locale = "en" | "no";

interface LanguageSwitcherProps {
  mobile?: boolean;
}

function LanguageSwitcher({ mobile = false }: LanguageSwitcherProps) {
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
        className={`px-2.5 py-1 text-xs font-semibold tracking-wide transition-all duration-150 ${
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
        className={`px-2.5 py-1 text-xs font-semibold tracking-wide transition-all duration-150 ${
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

// ─── Header ──────────────────────────────────────────────────────────────────

export default function Header() {
  const t                              = useTranslations("nav");
  const { data: session }              = useSession();
  const pathname                       = usePathname();
  const [mobileOpen, setMobileOpen]   = useState(false);

  // NAV_ITEMS built from translation keys so they auto-switch language
  const NAV_ITEMS = [
    { label: t("home"),       href: "/"            },
    { label: t("categories"), href: "/categories"  },
    { label: t("businesses"), href: "/search"      },
    { label: t("about"),      href: "/about"       },
  ] as const;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="navbar shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Main bar ── */}
        <div className="flex items-center h-16 gap-4">

          {/* Left — Logo */}
          <div className="flex-1 flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-700 transition-colors duration-200">
                <span className="text-white text-[11px] font-bold tracking-tight">DL</span>
              </div>
              <span className="text-[17px] font-semibold text-gray-900 tracking-tight leading-none">
                Din<span className="text-primary-700">Links</span>
              </span>
            </Link>
          </div>

          {/* Center — Navigation (desktop) */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  isActive(item.href)
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right — Language + Auth (desktop) */}
          <div className="flex-1 hidden lg:flex items-center justify-end gap-3">
            <LanguageSwitcher />
            <span className="w-px h-5 bg-gray-200" aria-hidden />

            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-150"
                >
                  {t("dashboard")}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
                >
                  {t("signOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-150"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150 whitespace-nowrap"
                >
                  {t("registerBusiness")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile — Hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

            {/* Nav items */}
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive(item.href)
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-3 mt-1 border-t border-gray-100 space-y-3">
              {/* Language switcher */}
              <div className="px-3 py-1">
                <LanguageSwitcher mobile />
              </div>

              {/* Auth actions */}
              {session?.user ? (
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    {t("dashboard")}
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    {t("signOut")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    {t("signIn")}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all"
                  >
                    {t("registerBusiness")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
