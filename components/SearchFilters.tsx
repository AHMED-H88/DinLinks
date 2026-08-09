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

// Mobile-only. The compact control row opens exactly one panel at a time.
type MobilePanel = "filter" | "sort" | null;

// ── Small functional outline icons (mobile control row + chips) ───────────────
function FunnelIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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
  // Mobile-only panel state. Collapsed by default so results sit directly below
  // the compact control row. Desktop ignores this entirely (its filters live in
  // a `hidden lg:block` column that is always expanded).
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const togglePanel = (panel: Exclude<MobilePanel, null>) =>
    setMobilePanel((cur) => (cur === panel ? null : panel));

  function updateParam(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    router.push(`/search?${params.toString()}` as any);
  }

  // Sort is a single choice — on mobile it closes the panel; on desktop there is
  // no panel to close.
  function selectSort(value: string, closePanel: boolean) {
    updateParam({ sort: value });
    if (closePanel) setMobilePanel(null);
  }

  // Category and City intentionally do NOT close the mobile Filter panel so the
  // user can set both in one pass. The panel closes on re-tapping Filtre or on
  // Reset.
  const selectCategory = (slug: string) => updateParam({ category: slug });

  function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam({ city: cityInput.trim() });
  }

  const clearCity = () => { setCityInput(""); updateParam({ city: "" }); };

  function resetAll() {
    setCityInput("");
    setMobilePanel(null);
    router.push("/search" as any);
  }

  const hasFilters = currentCategory || currentCity;

  const allCategoryItems = categories.flatMap((g) => [
    { slug: g.slug, name: g.name },
    ...g.subcategories,
  ]);
  const selectedCategory = allCategoryItems.find((c) => c.slug === currentCategory);
  const selectedCategoryLabel = selectedCategory
    ? (tCat.has(selectedCategory.slug) ? tCat(selectedCategory.slug) : selectedCategory.name)
    : t("allCategories");

  // ── Shared control bodies — identical markup for desktop cards and mobile
  //    panels, so filtering logic and URL behavior have a single source. ──────
  const sortOptions = (closePanel: boolean) => (
    <div className="space-y-1">
      {SORT_OPTIONS.map(({ value, labelKey }) => (
        <button
          key={value}
          onClick={() => selectSort(value, closePanel)}
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
  );

  // `neutral` (mobile) uses black/gray selected states; the default (desktop)
  // keeps the existing primary-tint selected states unchanged.
  const categoryTree = (neutral: boolean) => {
    const selected = neutral
      ? "bg-gray-900 text-white font-semibold"
      : "bg-primary-50 text-primary-700 font-semibold border border-primary-100";
    const groupSelected = neutral
      ? "bg-gray-900 text-white"
      : "bg-primary-50 text-primary-700 border border-primary-100";
    return (
    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
      <button
        onClick={() => selectCategory("")}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
          !currentCategory ? selected : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
              currentCategory === group.slug ? groupSelected : "text-gray-900 hover:bg-gray-50"
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
                    currentCategory === sub.slug ? selected : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
    );
  };

  const cityBox = (neutral: boolean) => {
    const selected = neutral
      ? "bg-gray-900 text-white font-semibold"
      : "bg-primary-50 text-primary-700 font-semibold border border-primary-100";
    const applyBtn = neutral
      ? "inline-flex items-center justify-center rounded-lg bg-gray-900 text-white px-3 py-2 text-xs font-medium hover:bg-gray-800 active:scale-[0.98] transition-colors"
      : "btn btn-primary px-3 py-2 text-xs";
    return (
    <div>
      <form onSubmit={handleCitySubmit} className="flex gap-2 mb-3">
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder={t("cityPlaceholder")}
          // Neutral focus on desktop only; the `lg:` variants do not apply on
          // mobile, so the mobile filter panel keeps its existing focus.
          className="input py-2 px-3 text-sm flex-1 lg:focus:border-gray-900 lg:focus:ring-gray-200"
        />
        <button type="submit" className={applyBtn}>{t("go")}</button>
      </form>

      {/* Popular cities */}
      {cities.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">{t("popularCities")}</p>
          {cities.slice(0, 8).map(({ city, count }) => {
            const isActive = currentCity.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                onClick={() => { setCityInput(city); updateParam({ city }); }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all ${
                  isActive ? selected : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{formatCity(city)}</span>
                <span className={`text-xs ${isActive && neutral ? "text-gray-300" : "text-gray-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {currentCity && (
        <button
          onClick={clearCity}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t("clearCity")}
        </button>
      )}
    </div>
    );
  };

  const sectionHeading = "text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3";

  return (
    <>
      {/* ── Mobile: compact control row + panels + active chips (lg:hidden) ── */}
      <div className="lg:hidden space-y-2.5">
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => togglePanel("filter")}
            aria-expanded={mobilePanel === "filter"}
            aria-controls="search-mobile-filter-panel"
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 active:scale-[0.99] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            <FunnelIcon />
            {t("filters")}
          </button>
          <button
            type="button"
            onClick={() => togglePanel("sort")}
            aria-expanded={mobilePanel === "sort"}
            aria-controls="search-mobile-sort-panel"
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 active:scale-[0.99] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            <SortIcon />
            {t("sort")}
          </button>
        </div>

        {mobilePanel === "sort" && (
          <div id="search-mobile-sort-panel" className="card p-3">
            {sortOptions(true)}
          </div>
        )}

        {mobilePanel === "filter" && (
          <div id="search-mobile-filter-panel" className="card p-4 space-y-5">
            <div>
              <h3 className={sectionHeading}>{t("category")}</h3>
              {categoryTree(true)}
            </div>
            <div>
              <h3 className={sectionHeading}>{t("city")}</h3>
              {cityBox(true)}
            </div>
            {hasFilters && (
              <button
                onClick={resetAll}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors underline underline-offset-2"
              >
                {t("resetAll")}
              </button>
            )}
          </div>
        )}

        {/* Active filter chips — whole chip is the remove control */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {currentCategory && (
              <button
                type="button"
                onClick={() => updateParam({ category: "" })}
                aria-label={`${t("remove")} ${selectedCategoryLabel}`}
                className="inline-flex items-center gap-1.5 h-9 pl-3 pr-2.5 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 active:scale-[0.99] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                <span>{selectedCategoryLabel}</span>
                <XIcon />
              </button>
            )}
            {currentCity && (
              <button
                type="button"
                onClick={clearCity}
                aria-label={`${t("remove")} ${formatCity(currentCity)}`}
                className="inline-flex items-center gap-1.5 h-9 pl-3 pr-2.5 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 active:scale-[0.99] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                <span>{formatCity(currentCity)}</span>
                <XIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Desktop: full expanded sidebar (hidden lg:block) — neutral selected
             states + black Apply, same layout/behavior ─────────────────────── */}
      <div className="hidden lg:block space-y-4">
        <div className="card p-4">
          <h3 className={sectionHeading}>{t("sortBy")}</h3>
          {sortOptions(false)}
        </div>

        <div className="card p-4">
          <h3 className={sectionHeading}>{t("category")}</h3>
          {categoryTree(true)}
        </div>

        <div className="card p-4">
          <h3 className={sectionHeading}>{t("city")}</h3>
          {cityBox(true)}
        </div>

        {hasFilters && (
          <button
            onClick={resetAll}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
          >
            {t("resetAll")}
          </button>
        )}
      </div>
    </>
  );
}
