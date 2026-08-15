import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function DashboardAccountGeneralPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("nav.general")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("generalPage.subtitle")}</p>
      </div>

      {/* Personal / sign-in account data — read-only in this phase */}
      <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4">
          <span className="text-sm text-gray-500">{t("generalPage.name")}</span>
          <span className="text-sm font-medium text-gray-900 truncate">
            {session.user.name ?? t("generalPage.noName")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4">
          <span className="text-sm text-gray-500">{t("generalPage.email")}</span>
          <span className="text-sm font-medium text-gray-900 truncate">{session.user.email}</span>
        </div>
      </div>
    </div>
  );
}
