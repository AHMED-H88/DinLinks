import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/routing";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

/**
 * Account landing — where the company manages its relationship with DinLinks,
 * as opposed to the business surfaces (Overview, Profile, Reviews, Locations).
 *
 * Every row points at functionality that already exists. Nothing here is a
 * placeholder: no security, sessions, team or notification settings, because
 * the product does not have them yet.
 */
export default async function DashboardAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");

  // Language is not listed here: the Header now renders in the mobile
  // workspace too, so its menu already offers the switch and a second control
  // would be a duplicate. Removing it empties the preferences group, so that
  // group goes with it rather than sitting here with no rows.
  const groups: {
    key: string;
    label: string;
    rows: { key: string; label: string; href: string }[];
  }[] = [
    {
      key: "account",
      label: t("accountPage.groups.account"),
      rows: [
        { key: "general", label: t("nav.general"), href: "/dashboard/account/general" },
        { key: "billing", label: t("nav.billing"), href: "/dashboard/account/billing" },
      ],
    },
    {
      key: "support",
      label: t("accountPage.groups.support"),
      rows: [{ key: "help", label: t("nav.help"), href: "/contact" }],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("nav.account")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("accountPage.subtitle")}</p>
      </div>

      <div className="space-y-7">
        {groups.map((group) => (
          <section key={group.key} className="space-y-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {group.label}
            </h2>
            <div className="divide-y divide-gray-100 border-y border-gray-100">
              {group.rows.map((row) => (
                <Link
                  key={row.key}
                  href={row.href as any}
                  className="flex items-center justify-between gap-4 py-3.5 text-sm text-gray-900 hover:text-gray-600 transition-colors"
                >
                  {row.label}
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <SignOutButton label={tNav("signOut")} />
      </div>
    </div>
  );
}
