import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import ReviewList from "@/components/ReviewList";

export const dynamic = "force-dynamic";

export default async function DashboardReviewsPage({
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
    include: { reviews: { orderBy: { createdAt: "desc" } } },
  });

  if (!business) {
    return <NeedsBusiness t={t} />;
  }

  const reviews = business.reviews;
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("nav.reviews")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("reviewsPage.subtitle")}</p>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">{t("reviewsPage.empty")}</p>
      ) : (
        <div>
          <div className="flex items-center gap-3 pb-5 mb-6 border-b border-gray-200">
            {avg && (
              <span className="flex items-center gap-1.5">
                <span className="text-amber-400 text-lg">★</span>
                <span className="text-lg font-bold text-gray-900">{avg}</span>
              </span>
            )}
            <span className="text-sm text-gray-500">
              {reviews.length} {t("reviews").toLowerCase()}
            </span>
          </div>
          <ReviewList reviews={reviews} locale={locale} />
        </div>
      )}
    </div>
  );
}

function NeedsBusiness({ t }: { t: (k: string) => string }) {
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
