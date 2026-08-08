"use client";

import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatCity } from "@/lib/format";

interface Subcategory { id: string; name: string; slug: string }
interface CategoryGroup { id: string; name: string; slug: string; subcategories: Subcategory[] }
interface CityCount { city: string; count: number }

interface SearchFiltersProps {
  categories: CategoryGroup[];
  cities: CityCount[];
}

const SORT_OPTIONS = [
  { value: "popular",  labelKey: "mostPopular"  },
  { value: "reviewed", labelKey: "mostReviewed" },
  { value: "newest",   labelKey: "newest"       },
  { value: "alpha",    labelKey: "alphabetical" },
] as const;

// Mobile-only accordion sections. Exactly one may be open at a time.
type OpenSection = "sort" | "category" | "city" | null;

// Shared chevron for the mobile collapsed rows. Purely functional (indicates
// expand/collapse) and rotates when its section is open.
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function SearchFilters({ categories, cities }: SearchFiltersProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslations("searchFilters");
  const tCat         = useTranslations("categories");

  const currentCategory = searchParams.get("category") ?? "";
  const currentCity     = searchParams.get("city")     ?? "";
  const currentSort     = searchParams.get("sort")     ?? "popular";
  const [cityInput, setCityInput] = useState(currentCity);
  // Mobile-only accordion state. Sort, Category and City each collapse to a
  // single row; only one is open at a time and all are collapsed by default so
  // results are reachable without scrolling past the filters. Desktop ignores
  // this entirely (each list is forced visible with `lg:block`).
  const [openSection, setOpenSection] = useState<OpenSection>(null);
  const toggleSection = (section: Exclude<OpenSection, null>) =>
    setOpenSection((cur) => (cur === section ? null : section));

  function updateParam(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    router.push(`/search?${params.toString()}` as any);
  }

  function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam({ city: cityInput.trim() });
    setOpenSection(null);
  }

  const hasFilters = currentCategory || currentCity;

  /** Applies the category filter and collapses the mobile accordion. */
  function selectCategory(slug: string) {
    updateParam({ category: slug });
    setOpenSection(null);
  }

  const allCategoryItems = categories.flatMap((g) => [
    { slug: g.slug, name: g.name },
    ...g.subcategories,
  ]);
  const selectedCategory = allCategoryItems.find((c) => c.slug === currentCategory);
  const selectedCategoryLabel = selectedCategory
    ? (tCat.has(selectedCategory.slug) ? tCat(selectedCategory.slug) : selectedCategory.name)
    : t("allCategories");

  // Label of the currently active sort, shown in the collapsed mobile Sort row.
  const currentSortLabel = t(
    SORT_OPTIONS.find((o) => o.value === currentSort)?.labelKey ?? "mostPopular"
  );

  return (
    <div className="space-y-4">
      {/* Sort */}
      <div className="card p-4">
        {/* Desktop heading — hidden on mobile in favour of the toggle */}
        <h3 className="hidden lg:block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t("sortBy")}</h3>

        {/* Mobile accordion toggle */}
        <button
          type="button"
          onClick={() => toggleSection("sort")}
          aria-expanded={openSection === "sort"}
          aria-controls="search-sort-list"
          className="lg:hidden w-full flex items-center justify-between gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {t("sortBy")}
          </span>
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {currentSortLabel}
            </span>
            <Chevron open={openSection === "sort"} />
          </span>
        </button>

        <div
          id="search-sort-list"
          className={`space-y-1 ${openSection === "sort" ? "block mt-3" : "hidden"} lg:block lg:mt-0`}
        >
          {SORT_OPTIONS.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => { updateParam({ sort: value }); setOpenSection(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                currentSort === value
                  ? "bg-gray-900 text-white font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="card p-4">
        {/* Desktop heading — unchanged, hidden on mobile in favour of the toggle */}
        <h3 className="hidden lg:block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t("category")}</h3>

        {/* Mobile accordion toggle */}
        <button
          type="button"
          onClick={() => toggleSection("category")}
          aria-expanded={openSection === "category"}
          aria-controls="search-category-list"
          className="lg:hidden w-full flex items-center justify-between gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {t("category")}
          </span>
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {selectedCategoryLabel}
            </span>
            <Chevron open={openSection === "category"} />
          </span>
        </button>

        <div
          id="search-category-list"
          className={`space-y-1 max-h-64 overflow-y-auto pr-1 ${openSection === "category" ? "block mt-3" : "hidden"} lg:block lg:mt-0`}
        >
          <button
            onClick={() => selectCategory("")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              !currentCategory
                ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {t("allCategories")}
          </button>
          {/* Two-level filter: top-level Category (parent group) with its
              Subcategories indented underneath. No third level. */}
          {categories.map((group) => (
            <div key={group.id} className="pt-1">
              <button
                onClick={() => selectCategory(group.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  currentCategory === group.slug
                    ? "bg-primary-50 text-primary-700 border border-primary-100"
                    : "text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tCat.has(group.slug) ? tCat(group.slug) : group.name}
              </button>
              {group.subcategories.length > 0 && (
                <div className="mt-0.5 ml-3 border-l border-gray-100 pl-2 space-y-0.5">
                  {group.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => selectCategory(sub.slug)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                        currentCategory === sub.slug
                          ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {tCat.has(sub.slug) ? tCat(sub.slug) : sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* City — text input */}
      <div className="card p-4">
        {/* Desktop heading — hidden on mobile in favour of the toggle */}
        <h3 className="hidden lg:block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t("city")}</h3>

        {/* Mobile accordion toggle */}
        <button
          type="button"
          onClick={() => toggleSection("city")}
          aria-expanded={openSection === "city"}
          aria-controls="search-city-panel"
          className="lg:hidden w-full flex items-center justify-between gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {t("city")}
          </span>
          <span className="flex items-center gap-1.5 min-w-0">
            {currentCity && (
              <span className="text-sm font-medium text-gray-900 truncate">
                {formatCity(currentCity)}
              </span>
            )}
            <Chevron open={openSection === "city"} />
          </span>
        </button>

        <div
          id="search-city-panel"
          className={`${openSection === "city" ? "block mt-3" : "hidden"} lg:block lg:mt-0`}
        >
          <form onSubmit={handleCitySubmit} className="flex gap-2 mb-3">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder={t("cityPlaceholder")}
              className="input py-2 px-3 text-sm flex-1"
            />
            <button type="submit" className="btn btn-primary px-3 py-2 text-xs">{t("go")}</button>
          </form>

          {/* Popular cities */}
          {cities.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">{t("popularCities")}</p>
              {cities.slice(0, 8).map(({ city, count }) => (
                <button
                  key={city}
                  onClick={() => { setCityInput(city); updateParam({ city }); setOpenSection(null); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all ${
                    currentCity.toLowerCase() === city.toLowerCase()
                      ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{formatCity(city)}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </button>
              ))}
            </div>
          )}

          {currentCity && (
            <button
              onClick={() => { setCityInput(""); updateParam({ city: "" }); setOpenSection(null); }}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t("clearCity")}
            </button>
          )}
        </div>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={() => { setCityInput(""); router.push("/search" as any); }}
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
        >
          {t("resetAll")}
        </button>
      )}
    </div>
  );
}
