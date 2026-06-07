import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import CategoryManager from "@/components/CategoryManager";

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          businesses: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Categories</h1>

        <CategoryManager categories={categories} />
      </main>
    </div>
  );
}
