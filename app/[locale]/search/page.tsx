import { Suspense } from "react";
import type { Metadata } from "next";
import SearchResults from "@/components/SearchResults";
import SearchFilters from "@/components/SearchFilters";
import SearchBar from "@/components/SearchBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string; category?: string; city?: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "search" });

  const parts: string[] = [];
  if (searchParams.q)        parts.push(`"${searchParams.q}"`);
  if (searchParams.category) parts.push(searchParams.category);
  if (searchParams.city)     parts.push(`${t("inPreposition")} ${searchParams.city}`);

  const title = parts.length
    ? t("metaTitle", { query: parts.join(" · ") })
    : t("metaDefault");

  return {
    title,
    description: t("metaDescription"),
    alternates: { canonical: "/search" },
  };
}

// TEMP PERF — remove after audit
async function perf<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const s = performance.now();
  try { return await fn(); }
  finally { console.log(`[perf] ${label}: ${(performance.now() - s).toFixed(1)}ms`); }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; city?: string; sort?: string };
}) {
  console.log("[perf] ── SearchPage shell render start ──");
  const t = await perf("shell.getTranslations", () => getTranslations("search"));

  // Fetch filters data in parallel
  const [categories, cityGroups] = await Promise.all([
    perf("shell.category.findMany", () =>
      prisma.category.findMany({ orderBy: { name: "asc" } })),
    perf("shell.business.groupBy(city)", () =>
      prisma.business.groupBy({
        by: ["city"],
        where: { status: "APPROVED", city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: "desc" } },
        take: 20,
      })),
  ]);

  const cities = cityGroups
    .filter((g) => g.city)
    .map((g) => ({ city: g.city as string, count: g._count.city }));

  const hasSearch = searchParams.q || searchParams.category || searchParams.city;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Search hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
            {hasSearch ? t("heading") : t("find")}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {t("discover")}
          </p>
          <SearchBar placeholder={t("placeholder")} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-6">
              <SearchFilters categories={categories} cities={cities} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <Suspense
              key={JSON.stringify(searchParams)}
              fallback={<ResultsSkeleton />}
            >
              <SearchResults searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card animate-pulse overflow-hidden">
          <div className="h-32 bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
