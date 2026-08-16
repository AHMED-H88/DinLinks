"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { icons } from "@/components/DashboardNav";

/**
 * The only global workspace navigation on mobile. Five equal destinations:
 * four business surfaces plus Account, which is a first-class destination
 * rather than an overflow menu — managing the business and managing the
 * DinLinks account are separate concerns.
 *
 * Desktop keeps the sidebar; this never renders above lg.
 */
export default function DashboardBottomNav() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  const items = [
    { key: "overview",  href: "/dashboard",           label: t("nav.overview"),  icon: icons.overview },
    { key: "profile",   href: "/dashboard/profile",   label: t("nav.profile"),   icon: icons.profile },
    { key: "reviews",   href: "/dashboard/reviews",   label: t("nav.reviews"),   icon: icons.reviews },
    { key: "locations", href: "/dashboard/locations", label: t("nav.locations"), icon: icons.locations },
    { key: "account",   href: "/dashboard/account",   label: t("nav.account"),   icon: icons.general },
  ];

  // Overview is the workspace root, so it matches exactly; everything else
  // owns its subtree. Nested account routes therefore keep Account lit.
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav
      aria-label={t("nav.workspaceLabel")}
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white"
      // Sit above the iPhone home indicator rather than under it. The matching
      // spacer in the dashboard layout keeps page content clear of this bar.
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex items-stretch">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <li key={it.key} className="flex-1 min-w-0">
              <Link
                href={it.href as any}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 px-0 pt-2 pb-1.5 transition-colors ${
                  active ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <svg
                  className="w-[22px] h-[22px] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  {it.icon}
                </svg>
                {/* 10px is the usual tab-bar label size and is what keeps the
                    longest Norwegian label, Anmeldelser, whole in a 64px slot
                    at 320px; there is room for 11px from 360px up. */}
                <span
                  className={`w-full truncate text-center text-[10px] min-[360px]:text-[11px] leading-tight ${
                    active ? "font-semibold" : "font-normal"
                  }`}
                >
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
