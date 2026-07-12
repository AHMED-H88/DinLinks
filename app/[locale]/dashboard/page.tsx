import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessForm from "@/components/BusinessForm";
import SubscriptionCard from "@/components/SubscriptionCard";
import BranchManager from "@/components/BranchManager";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const tCat = await getTranslations({ locale, namespace: "categories" });

  if (!session?.user) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { userId: session!.user!.id },
    include: {
      category:     true,
      subscription: true,
      branches:     { orderBy: [{ isMainBranch: "desc" }, { name: "asc" }] },
      _count: { select: { favorites: true, reviews: true } },
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const stats = business
    ? [
        {
          label: t("profileViews"),
          value: business.views ?? 0,
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          ),
        },
        {
          label: t("favorites"),
          value: business._count.favorites,
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          ),
        },
        {
          label: t("reviews"),
          value: business._count.reviews,
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          ),
        },
        {
          label: t("branches"),
          value: business.branches?.length ?? 0,
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
            />
          ),
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* ── Welcome bar ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("title")}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {t("welcomeBack")}{" "}
              <span className="font-medium text-gray-700">
                {session!.user!.name ?? session!.user!.email}
              </span>
            </p>
          </div>

          {business?.status === "APPROVED" && (
            <Link
              href={`/business/${business.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-subtle"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              {t("viewPublicProfile")}
            </Link>
          )}
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stats.map(({ label, value, icon }) => (
              <div key={label} className="card p-4 sm:p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {icon}
                  </svg>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* Business form — spans 2 cols */}
          <div className="lg:col-span-2">
            <div className="card p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {business ? t("editProfile") : t("createProfile")}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {business ? t("editSubtitle") : t("createSubtitle")}
                </p>
              </div>

              <BusinessForm
                business={
                  business
                    ? {
                        id:           business.id,
                        userId:       business.userId,
                        name:         business.name,
                        description:  business.description,
                        categoryId:   business.categoryId,
                        logo:         business.logo,
                        coverImage:   business.coverImage,
                        images:       business.images,
                        services:     business.services as any,
                        address:      business.address,
                        city:         business.city,
                        postalCode:   business.postalCode,
                        latitude:     business.latitude,
                        longitude:    business.longitude,
                        phone:        business.phone,
                        email:        business.email,
                        website:      business.website,
                        bookingLink:  business.bookingLink,
                        mapLink:      business.mapLink,
                        openingHours: business.openingHours,
                        status:       business.status,
                      }
                    : null
                }
                categories={categories}
              />
            </div>

            {/* ── Branch manager (only when business exists) ──────────── */}
            {business && (
              <div className="card p-6 sm:p-8 mt-8">
                <BranchManager
                  locale={locale}
                  businessId={business.id}
                  initialBranches={business.branches as any}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <SubscriptionCard
              subscription={business?.subscription}
              businessId={business?.id}
            />

            {/* Getting started tips (only for new users) */}
            {!business && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">{t("gettingStarted")}</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", text: t("step1") },
                    { step: "2", text: t("step2") },
                    { step: "3", text: t("step3") },
                    { step: "4", text: t("step4") },
                    { step: "5", text: t("step5") },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step}
                      </span>
                      <span className="text-sm text-gray-600">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick info card for existing businesses */}
            {business && (
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">{t("profileInfo")}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("statusLabel")}</span>
                    <StatusPill status={business.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("category")}</span>
                    <span className="font-medium text-gray-800 text-right">{business.category ? (tCat.has(business.category.slug) ? tCat(business.category.slug) : business.category.name) : "—"}</span>
                  </div>
                  {business.city && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("city")}</span>
                      <span className="font-medium text-gray-800">{business.city}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("photos")}</span>
                    <span className="font-medium text-gray-800">{business.images.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const t = useTranslations("dashboard");
  if (status === "APPROVED")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{t("approved")}</span>;
  if (status === "PENDING")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{t("pending")}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{t("rejected")}</span>;
}
