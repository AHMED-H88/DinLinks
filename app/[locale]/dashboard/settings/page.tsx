import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import SubscriptionCard from "@/components/SubscriptionCard";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage({
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
    include: { subscription: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("nav.settings")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("settingsPage.subtitle")}</p>
      </div>

      {/* Account & security */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">{t("settingsPage.accountSecurity")}</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500">{t("settingsPage.email")}</span>
            <span className="text-sm font-medium text-gray-900 truncate">{session!.user!.email}</span>
          </div>
          <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
            {t("settingsPage.securityUnavailable")}
          </p>
        </div>
      </section>

      {/* Plan & billing — existing subscription UI, logic unchanged */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">{t("settingsPage.planBilling")}</h2>
        <SubscriptionCard subscription={business?.subscription} businessId={business?.id} />
      </section>

      {/* People & access — reserved for a future phase (not implemented) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">{t("settingsPage.peopleAccess")}</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <p className="text-sm text-gray-400">{t("settingsPage.peopleAccessPlanned")}</p>
        </div>
      </section>
    </div>
  );
}
