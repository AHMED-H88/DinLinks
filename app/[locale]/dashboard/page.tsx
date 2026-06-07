import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessForm from "@/components/BusinessForm";
import SubscriptionCard from "@/components/SubscriptionCard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { userId: session!.user!.id },
    include: {
      category: true,
      subscription: true,
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Velkommen tilbake! Administrer bedriftsprofilen din.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-8 sm:p-10 shadow-medium">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                    {business ? "Rediger profil" : "Opprett profil"}
                  </h2>
                  <p className="text-gray-600">
                    {business
                      ? "Oppdater bedriftsinformasjonen din"
                      : "Lag din bedriftsprofil og kom i gang"}
                  </p>
                </div>
                {business && (
                  <div className="hidden sm:block">
                    {business.status === "APPROVED" && (
                      <span className="badge badge-green text-sm px-4 py-2">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Godkjent
                      </span>
                    )}
                    {business.status === "PENDING" && (
                      <span className="badge badge-yellow text-sm px-4 py-2">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Venter
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="divider mb-8"></div>
              <BusinessForm business={business} categories={categories} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SubscriptionCard subscription={business?.subscription} businessId={business?.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
