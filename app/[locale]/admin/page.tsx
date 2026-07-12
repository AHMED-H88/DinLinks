import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import AdminNav from "@/components/AdminNav";
import BusinessTable from "@/components/BusinessTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const t = await getTranslations("admin");

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const businesses = await prisma.business.findMany({
    include: {
      user: {
        select: {
          name:  true,
          email: true,
        },
      },
      category:     true,
      subscription: true,
      _count: {
        select: {
          favorites: true,
          reviews:   true,
        },
      },
    },
    orderBy: [
      // PENDING first so admins see what needs action immediately
      { status: "asc" },
      { createdAt: "desc" },
    ],
  });

  const stats = {
    total:    businesses.length,
    pending:  businesses.filter((b) => b.status === "PENDING").length,
    approved: businesses.filter((b) => b.status === "APPROVED").length,
    rejected: businesses.filter((b) => b.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t("subtitle")}
          </p>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={t("total")}
            value={stats.total}
            color="text-gray-900"
            bg="bg-white"
          />
          <StatCard
            label={t("pending")}
            value={stats.pending}
            color="text-amber-600"
            bg="bg-amber-50"
            border="border-amber-100"
            urgent={stats.pending > 0}
          />
          <StatCard
            label={t("approved")}
            value={stats.approved}
            color="text-green-600"
            bg="bg-green-50"
            border="border-green-100"
          />
          <StatCard
            label={t("rejected")}
            value={stats.rejected}
            color="text-red-500"
            bg="bg-red-50"
            border="border-red-100"
          />
        </div>

        {/* ── Business table ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
          <BusinessTable businesses={businesses as any} />
        </div>
      </main>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  bg,
  border = "border-gray-100",
  urgent = false,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  border?: string;
  urgent?: boolean;
}) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-5 relative overflow-hidden`}>
      {urgent && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
