import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="lg:flex lg:gap-10 lg:items-start">
          <DashboardNav />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
