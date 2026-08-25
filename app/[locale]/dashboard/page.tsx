import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { buildDisplayLocations } from "@/lib/locations";
import type { Branch } from "@/components/BranchManager";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({
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
    include: {
      branches: { orderBy: [{ isMainBranch: "desc" }, { name: "asc" }] },
      _count:   { select: { favorites: true, reviews: true } },
    },
  });

  // ── No business yet — guide the owner to create one ─────────────────────────
  if (!business) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("title")}</h1>
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
      </div>
    );
  }

  // Locations shown on the public profile = the primary business address (when
  // present) + additional Branch records. This reconciles the dashboard count
  // with what visitors actually see (see PR notes on the historic 0-vs-1 gap).
  const displayLocations = buildDisplayLocations(business, (business.branches ?? []) as unknown as Branch[]);

  const statusMap: Record<string, { label: string; dot: string }> = {
    APPROVED: { label: t("status.published"),    dot: "bg-emerald-500" },
    PENDING:  { label: t("status.inReview"),     dot: "bg-amber-500" },
    REJECTED: { label: t("status.notPublished"), dot: "bg-gray-400" },
  };
  const status = statusMap[business.status] ?? statusMap.PENDING;

  const stats = [
    { key: "views",     label: t("profileViews"),  value: business.views ?? 0 },
    { key: "favorites", label: t("favorites"),     value: business._count.favorites },
    { key: "reviews",   label: t("reviews"),       value: business._count.reviews },
    { key: "locations", label: t("nav.locations"), value: displayLocations.length },
  ];

  return (
    <div className="space-y-8">
      {/* Title + lightweight status, actions inline */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("title")}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span className="text-sm text-gray-600">{status.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            {t("editProfile")}
          </Link>
          {business.status === "APPROVED" && (
            <Link
              href={`/business/${business.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {t("viewPublicProfile")}
            </Link>
          )}
        </div>
      </div>

      {/* Metrics — one calm unit, dividers instead of four separate cards */}
      <div className="rounded-2xl border border-gray-200 bg-white grid grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.key}
            className={`p-5 ${i % 2 === 1 ? "border-l border-gray-100 " : ""}${i >= 2 ? "border-t border-gray-100 " : ""}lg:border-t-0 ${i > 0 ? "lg:border-l lg:border-gray-100" : ""}`}
          >
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
