"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export default function CategoriesClient({ categories }: { categories: CategoryItem[] }) {
  const t = useTranslations("categoriesClient");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-sm mb-8">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="input pl-10 py-2.5 text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{t("noCategories")}</h3>
          <p className="text-sm text-gray-500">{t("tryDifferent")}</p>
          <button onClick={() => setQuery("")} className="mt-4 text-sm text-primary-700 hover:underline">
            {t("clearSearch")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group card card-hover p-5 flex flex-col items-center text-center gap-3"
            >
              <span className="text-3xl leading-none" role="img" aria-label={cat.name}>
                {cat.icon}
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                  {cat.name}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {cat.count} {cat.count === 1 ? t("businessSingular") : t("businessPlural")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
