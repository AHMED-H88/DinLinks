import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import BranchManager, { type Branch } from "@/components/BranchManager";
import { buildDisplayLocations } from "@/lib/locations";

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

  const publicCount = buildDisplayLocations(business, (business.branches ?? []) as unknown as Branch[]).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("nav.locations")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("locationsPage.subtitle")}</p>
      </div>

      {/* Explains the historic dashboard-vs-public count difference honestly. */}
      <p className="text-sm text-gray-500 rounded-xl border border-gray-200 bg-white px-4 py-3">
        {t("locationsPage.primaryNote", { count: publicCount })}
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8">
        <BranchManager
          locale={locale}
          businessId={business.id}
          initialBranches={business.branches as any}
        />
      </div>
    </div>
  );
}
