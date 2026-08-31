import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import DashboardNav from "@/components/DashboardNav";
import DashboardBottomNav from "@/components/DashboardBottomNav";
import DashboardIdentity from "@/components/DashboardIdentity";

export const dynamic = "force-dynamic";

/**
 * Shared Dashboard V2 shell: the global Header, a persistent desktop
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

  const tCat = await getTranslations("categories");

  // Minimal identity for the sidebar header — existing data only.
  const business = await prisma.business.findUnique({
    where:  { userId: session.user.id },
    select: {
      id: true, name: true, logo: true, city: true, status: true,
      // URL identity: without these the sidebar's "View public profile" link
      // silently degrades to the legacy id URL and eats a 308 on every click.
      shortId: true, isDemo: true,
      category: { select: { slug: true, name: true } },
    },
  });

  const identity = business
    ? {
        id:           business.id,
        shortId:      business.shortId,
        isDemo:       business.isDemo,
        name:         business.name,
        logo:         business.logo,
        city:         business.city,
        status:       business.status,
        categorySlug: business.category?.slug ?? null,
        categoryName: business.category?.name ?? null,
      }
    : null;

  const categoryLabel = identity?.categorySlug
    ? (tCat.has(identity.categorySlug) ? tCat(identity.categorySlug) : identity.categoryName)
    : identity?.categoryName ?? null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* The shared site Header, at every width. It is what keeps the
          workspace recognisably part of DinLinks and carries the existing
          menu — public navigation, language, Min side, Konto, sign out — so
          the workspace needs no header of its own. */}
      <Header />

      {/* Level two: the business being managed, directly under the DinLinks
          identity. Workspace destinations live in the bottom navigation. */}
      {identity && (
        <div className="lg:hidden border-b border-gray-200 bg-white px-4 py-3">
          <DashboardIdentity business={identity} categoryLabel={categoryLabel} compact />
        </div>
      )}

      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-10">
        <div className="lg:flex lg:gap-16 lg:items-start">
          <DashboardNav business={identity} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>

      {/* No public Footer in here. The workspace is a signed-in tool, and the
          marketing footer — branding, product links, legal, contact — added a
          screen of public-site page to the bottom of every dashboard view. It
          read as a public page embedded in a dashboard, and on mobile it sat
          directly above the fixed workspace navigation. The Footer is
          unchanged and still renders on every public page. */}

      {/* Clears the fixed bottom bar (plus the home indicator) so no page ever
          hides its last control behind it. Desktop has no bar, so no spacer. */}
      <div
        className="lg:hidden"
        style={{ height: "calc(4.25rem + env(safe-area-inset-bottom, 0px))" }}
        aria-hidden
      />
      <DashboardBottomNav />
    </div>
  );
}
