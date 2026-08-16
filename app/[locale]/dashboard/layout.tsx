import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import DashboardNav from "@/components/DashboardNav";

export const dynamic = "force-dynamic";

/**
 * Shared Dashboard V2 shell: global Header + Footer, a persistent desktop
 * navigation sidebar and a distinct compact mobile navigation, wrapping every
 * dashboard destination (Overview, Business profile, Reviews, Locations,
 * Settings). Auth is enforced here (middleware also guards /dashboard).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Minimal identity for the sidebar header — existing data only.
  const business = await prisma.business.findUnique({
    where:  { userId: session.user.id },
    select: {
      id: true, name: true, logo: true, city: true, status: true,
      category: { select: { slug: true, name: true } },
    },
  });

  const identity = business
    ? {
        id:           business.id,
        name:         business.name,
        logo:         business.logo,
        city:         business.city,
        status:       business.status,
        categorySlug: business.category?.slug ?? null,
        categoryName: business.category?.name ?? null,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-10">
        <div className="lg:flex lg:gap-16 lg:items-start">
          <DashboardNav business={identity} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      {/* No public Footer here: the workspace ends with workspace content.
          The marketing Footer stays on the public pages that render it. */}
    </div>
  );
}
