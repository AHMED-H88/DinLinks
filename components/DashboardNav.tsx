"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { formatCity } from "@/lib/format";

interface NavItem {
  key:   string;
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

export interface DashboardBusinessIdentity {
  id:           string;
  name:         string | null;
  logo:         string | null;
  city:         string | null;
  status:       string;
  categorySlug: string | null;
  categoryName: string | null;
}

const icons: Record<string, React.ReactNode> = {
  overview:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25A2.25 2.25 0 018.25 10.5H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
  profile:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />,
  reviews:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
  locations: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />,
  settings:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  help:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />,
  general:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
  billing:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 19.5h16.5A2.25 2.25 0 0022.5 17.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v10.5A2.25 2.25 0 003.75 19.5z" />,
};

function DesktopLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href as any}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
      {label}
    </Link>
  );
}

/** Workspace-level tab. Deliberately quieter than the Profile section tabs
 *  that sit below it — normal weight when idle, medium when active — so the
 *  two rows read as different levels rather than two copies of one bar. */
function MobileTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href as any}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap px-1 py-2.5 text-sm border-b-2 transition-colors ${
        active
          ? "border-gray-900 text-gray-900 font-medium"
          : "border-transparent text-gray-500 font-normal hover:text-gray-900"
      }`}
    >
      {label}
    </Link>
  );
}

function Identity({
  business,
  categoryLabel,
  compact = false,
}: {
  business:      DashboardBusinessIdentity;
  categoryLabel: string | null;
  compact?:      boolean;
}) {
  const size = compact ? "w-9 h-9" : "w-10 h-10";
  const meta = [categoryLabel, business.city ? formatCity(business.city) : null].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`${size} rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        {business.logo ? (
          <Image src={business.logo} alt={business.name ?? ""} width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-gray-500 select-none">
            {(business.name ?? "?").slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{business.name ?? "—"}</p>
        {meta && <p className="text-xs text-gray-500 truncate">{meta}</p>}
      </div>
    </div>
  );
}

interface NavGroup {
  key:   string;
  label: string;
  items: NavItem[];
}

export default function DashboardNav({ business }: { business: DashboardBusinessIdentity | null }) {
  const t = useTranslations("dashboard");
  const tCat = useTranslations("categories");
  const pathname = usePathname();

  const categoryLabel = business?.categorySlug
    ? (tCat.has(business.categorySlug) ? tCat(business.categorySlug) : business.categoryName)
    : business?.categoryName ?? null;

  const groups: NavGroup[] = [
    {
      key:   "business",
      label: t("nav.groups.business"),
      items: [
        { key: "overview",  href: "/dashboard",           label: t("nav.overview"),  icon: icons.overview },
        { key: "profile",   href: "/dashboard/profile",   label: t("nav.profile"),   icon: icons.profile },
        { key: "reviews",   href: "/dashboard/reviews",   label: t("nav.reviews"),   icon: icons.reviews },
        { key: "locations", href: "/dashboard/locations", label: t("nav.locations"), icon: icons.locations },
      ],
    },
    {
      key:   "account",
      label: t("nav.groups.account"),
      items: [
        { key: "general", href: "/dashboard/account/general", label: t("nav.general"), icon: icons.general },
        { key: "billing", href: "/dashboard/account/billing", label: t("nav.billing"), icon: icons.billing },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const helpHref = "/contact";

  // ── Mobile "More" menu ──────────────────────────────────────────────────────
  // Mobile keeps three primary destinations plus More. Locations joins the
  // Account entries and Help behind the menu: four labels fit a 320px row
  // without scrolling, five do not, and a half-clipped label is worse than a
  // destination one tap away. Desktop still lists everything in the sidebar.
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const byKey = (key: string) =>
    groups.flatMap((g) => g.items).find((it) => it.key === key)!;

  const primaryItems = ["overview", "profile", "reviews"].map(byKey);

  // Rendered as separate blocks with a hairline between them: the workspace
  // destination, then the account pair, then Help, which leaves the workspace.
  const moreGroups = [
    [byKey("locations")],
    [byKey("general"), byKey("billing")],
    [{ key: "help", href: helpHref, label: t("nav.help"), icon: icons.help }],
  ];

  const moreActive =
    pathname.startsWith("/dashboard/account") || pathname.startsWith("/dashboard/locations");

  // Close on navigation — Link keeps this component mounted across routes.
  useEffect(() => setMoreOpen(false), [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  // No auto-scroll here any more: with four labels the row fits every
  // supported width, so there is nothing to scroll into view. The Profile
  // section strip keeps its own auto-scroll, which has many more tabs.

  return (
    <>
      {/* Desktop — persistent grouped sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 flex-shrink-0 lg:sticky lg:top-24 self-start">
        {business && (
          <div className="mb-5 pb-5 border-b border-gray-200">
            <Identity business={business} categoryLabel={categoryLabel} />
            {business.status === "APPROVED" && (
              <Link
                href={`/business/${business.id}` as any}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                {t("viewPublicProfile")}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </Link>
            )}
          </div>
        )}
        <nav aria-label={t("nav.menuLabel")} className="space-y-6">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{g.label}</p>
              <div className="flex flex-col gap-1">
                {g.items.map((it) => (
                  <DesktopLink key={it.key} href={it.href} label={it.label} icon={it.icon} active={isActive(it.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <DesktopLink href={helpHref} label={t("nav.help")} icon={icons.help} active={false} />
        </div>
      </aside>

      {/* Mobile — compact identity above a single primary row. The group labels
          and the standalone Help block are desktop-only; on a phone they cost
          most of the first screen before any page content appears. */}
      <div className="lg:hidden mb-4">
        {business && (
          <div className="mb-2.5">
            <Identity business={business} categoryLabel={categoryLabel} compact />
          </div>
        )}
        <nav
          aria-label={t("nav.menuLabel")}
          className="-mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-200"
        >
          {/* All four fit every supported width, so the row is spread rather
              than scrolled — nothing is ever half-clipped, and with no overflow
              container the menu cannot be clipped either. */}
          <div className="flex items-stretch justify-between gap-2">
            {primaryItems.map((it) => (
              <MobileTab key={it.key} href={it.href} label={it.label} active={isActive(it.href)} />
            ))}

            <div ref={moreRef} className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                aria-current={moreActive ? "page" : undefined}
                className={`flex h-full items-center gap-1 whitespace-nowrap px-1 py-2.5 text-sm border-b-2 transition-colors ${
                  moreActive
                    ? "border-gray-900 text-gray-900 font-medium"
                    : "border-transparent text-gray-500 font-normal hover:text-gray-900"
                }`}
              >
                {t("nav.more")}
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1.5 w-[13.5rem] rounded-md border border-gray-200 bg-white py-1 shadow-subtle"
                >
                  {moreGroups.map((group, i) => (
                    <div
                      key={group[0].key}
                      className={i > 0 ? "mt-1 pt-1 border-t border-gray-100" : undefined}
                    >
                      {group.map((it) => (
                        <Link
                          key={it.key}
                          role="menuitem"
                          href={it.href as any}
                          aria-current={isActive(it.href) ? "page" : undefined}
                          onClick={() => setMoreOpen(false)}
                          className={`block px-3.5 py-2 text-sm transition-colors ${
                            isActive(it.href)
                              ? "font-medium text-gray-900 bg-gray-50"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
