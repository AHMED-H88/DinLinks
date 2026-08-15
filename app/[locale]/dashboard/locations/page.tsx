import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import BranchManager from "@/components/BranchManager";
import { formatCity } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardLocationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { userId: session!.user!.id },
    include: { branches: { orderBy: [{ isMainBranch: "desc" }, { name: "asc" }] } },
  });

  if (!business) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900">{t("overview.needBusinessTitle")}</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{t("overview.needBusinessBody")}</p>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          {t("createProfile")}
        </Link>
      </div>
    );
  }

  // The primary business address counts as one public location (same rule the
  // public profile uses via buildDisplayLocations). Showing it explicitly here
  // resolves the historic "0 locations" confusion without changing any logic.
  const hasPrimary = Boolean(business.address || business.city);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("nav.locations")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("locationsPage.subtitle")}</p>
      </div>

      {/* Hovedlokasjon — the primary business address (edited under Business profile) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">{t("locationsPage.mainLocation")}</h2>
        {hasPrimary ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            {business.address && <p className="font-medium text-gray-900">{business.address}</p>}
            {(business.postalCode || business.city) && (
              <p className="text-sm text-gray-500 mt-0.5">
                {[business.postalCode, business.city ? formatCity(business.city) : null].filter(Boolean).join(" ")}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-3">{t("locationsPage.mainLocationHint")}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t("locationsPage.noMainLocation")}</p>
        )}
      </section>

      {/* Filialer — additional Branch records */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">{t("locationsPage.branches")}</h2>
        <BranchManager
          locale={locale}
          businessId={business.id}
          initialBranches={business.branches as any}
        />
      </section>
    </div>
  );
}
