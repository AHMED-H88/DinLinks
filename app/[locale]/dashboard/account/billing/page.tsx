import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import BillingSummary from "@/components/BillingSummary";

export const dynamic = "force-dynamic";

export default async function DashboardAccountBillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where:   { userId: session!.user!.id },
    include: { subscription: true },
  });

  const sub = business?.subscription
    ? {
        status:           business.subscription.status,
        plan:             business.subscription.plan,
        currentPeriodEnd: business.subscription.currentPeriodEnd,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("nav.billing")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("billingPage.subtitle")}</p>
      </div>

      <BillingSummary subscription={sub} businessId={business?.id} />
    </div>
  );
}
