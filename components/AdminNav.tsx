import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AdminNav() {
  const session = await auth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              DinLinks Admin
            </Link>
            <Link href="/admin" className="text-gray-700 hover:text-gray-900">
              Businesses
            </Link>
            <Link href="/admin/categories" className="text-gray-700 hover:text-gray-900">
              Categories
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-700">{session?.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="btn btn-outline">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
