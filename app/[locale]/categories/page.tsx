import type { Metadata } from "next";
import { getTaxonomyTree } from "@/lib/cached-data";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoriesClient from "@/components/CategoriesClient";

// Was `force-dynamic`. Public, non-user-specific category listing.
export const revalidate = 300; // 5 minutes

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "categoriesPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("ogDescription"),
      type: "website",
    },
  };
}

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
  const t = await getTranslations("categoriesPage");
  const tCat = await getTranslations("categories");
  // Top-level Categories only, in approved Taxonomy v1 order. Each carries its
  // Subcategories so the index can expose them under each top-level Category.
  const tree = await getTaxonomyTree();

  const categoriesWithMeta = tree.map((c) => ({
    id:    c.id,
    name:  tCat.has(c.slug) ? tCat(c.slug) : c.name,
    slug:  c.slug,
    icon:  c.icon ?? getCategoryIcon(c.slug),
    count: c.count,
    subcategories: c.children.map((s) => ({
      id:   s.id,
      name: tCat.has(s.slug) ? tCat(s.slug) : s.name,
      slug: s.slug,
      count: s.count,
    })),
  }));

  const totalBusinesses = categoriesWithMeta.reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-gray-100 py-12 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs font-semibold text-primary-700 uppercase tracking-widest mb-3">{t("title")}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              {t("allCategories")}
            </h1>
            <p className="text-base text-gray-500 max-w-xl mx-auto">
              {categoriesWithMeta.length} {t("categoriesLabel")} ·{" "}
              <span className="font-medium text-gray-700">{totalBusinesses}</span> {t("businesses")}
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
