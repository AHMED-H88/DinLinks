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
    // `title` goes through the root layout's "%s | DinLinks" template, so it
    // carries no suffix of its own. Open Graph has no template, so its title
    // keeps the brand explicitly — the same split every other page uses.
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
    },
  };
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              {t("allCategories")}
            </h1>
            <p className="text-base text-gray-500 max-w-xl mx-auto mb-4">
              {t("subtitle")}
            </p>
            <p className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>
                {categoriesWithMeta.length}{" "}
                {categoriesWithMeta.length === 1 ? t("categorySingular") : t("categoriesLabel")}
              </span>
              <span>
                {totalBusinesses}{" "}
                {totalBusinesses === 1 ? t("businessSingular") : t("businesses")}
              </span>
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
