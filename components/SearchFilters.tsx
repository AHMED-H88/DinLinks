"use client";

import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Category { id: string; name: string; slug: string }
interface CityCount { city: string; count: number }

interface SearchFiltersProps {
  categories: Category[];
  cities: CityCount[];
}

const SORT_OPTIONS = [
  { value: "popular",  labelKey: "mostPopular"  },
  { value: "reviewed", labelKey: "mostReviewed" },
  { value: "newest",   labelKey: "newest"       },
  { value: "alpha",    labelKey: "alphabetical" },
] as const;

export default function SearchFilters({ categories, cities }: SearchFiltersProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslations("searchFilters");

  const currentCategory = searchParams.get("category") ?? "";
  const currentCity     = searchParams.get("city")     ?? "";
  const currentSort     = searchParams.get("sort")     ?? "popular";
  const [cityInput, setCityInput] = useState(currentCity);

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
  }

  const hasFilters = currentCategory || currentCity;

  return (
    <div className="space-y-4">
      {/* Sort */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t("sortBy")}</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => updateParam({ sort: value })}
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
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t("category")}</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          <button
            onClick={() => updateParam({ category: "" })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              !currentCategory
                ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam({ category: cat.slug })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                currentCategory === cat.slug
                  ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* City — text input */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t("city")}</h3>
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
                onClick={() => { setCityInput(city); updateParam({ city }); }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all ${
                  currentCity.toLowerCase() === city.toLowerCase()
                    ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{city}</span>
                <span className="text-xs text-gray-400">{count}</span>
              </button>
            ))}
          </div>
        )}

        {currentCity && (
          <button
            onClick={() => { setCityInput(""); updateParam({ city: "" }); }}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t("clearCity")}
          </button>
        )}
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
