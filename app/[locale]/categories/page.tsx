import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoriesClient from "@/components/CategoriesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Categories | DinLinks",
  description:
    "Explore all business categories on DinLinks — from restaurants and retail to health and automotive. Find exactly what you need.",
  openGraph: {
    title: "Browse Categories | DinLinks",
    description: "Explore all business categories on DinLinks.",
    type: "website",
  },
};

// Category icon map — used to give each category a visual cue
const CATEGORY_ICONS: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  retail: "🛍️",
  health: "🏥",
  fitness: "💪",
  automotive: "🚗",
  beauty: "💅",
  education: "📚",
  technology: "💻",
  legal: "⚖️",
  finance: "💳",
  construction: "🔨",
  cleaning: "🧹",
  real_estate: "🏠",
  travel: "✈️",
  entertainment: "🎭",
  sports: "⚽",
  hotel: "🏨",
  photography: "📸",
  design: "🎨",
};

function getCategoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug.toLowerCase()] ?? "🏢";
}

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          businesses: {
            where: { status: "APPROVED" },
          },
        },
      },
    },
  });

  const categoriesWithMeta = categories.map((c) => ({
    id:    c.id,
    name:  c.name,
    slug:  c.slug,
    icon:  c.icon ?? getCategoryIcon(c.slug),
    count: c._count.businesses,
  }));

  const totalBusinesses = categoriesWithMeta.reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-gray-100 py-12 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs font-semibold text-primary-700 uppercase tracking-widest mb-3">Browse</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              All categories
            </h1>
            <p className="text-base text-gray-500 max-w-xl mx-auto">
              {categoriesWithMeta.length} categories ·{" "}
              <span className="font-medium text-gray-700">{totalBusinesses}</span> verified businesses
            </p>
          </div>
        </section>

        {/* Grid with search */}
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <CategoriesClient categories={categoriesWithMeta} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
