import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import BusinessTable from "@/components/BusinessTable";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const businesses = await prisma.business.findMany({
    include: {
      user: {
        select: {
          email: true,
        },
      },
      category: true,
      subscription: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: businesses.length,
    pending: businesses.filter((b) => b.status === "PENDING").length,
    approved: businesses.filter((b) => b.status === "APPROVED").length,
    rejected: businesses.filter((b) => b.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-sm text-gray-600 mb-1">Total Businesses</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Businesses</h2>
            <BusinessTable businesses={businesses as any} />
          </div>
        </div>
      </main>
    </div>
  );
}
