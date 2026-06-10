"use client";

import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface Category { id: string; name: string; slug: string }
interface CityCount { city: string; count: number }

interface SearchFiltersProps {
  categories: Category[];
  cities: CityCount[];
}

const SORT_OPTIONS = [
  { value: "popular",  label: "Most popular"  },
  { value: "reviewed", label: "Most reviewed"  },
  { value: "newest",   label: "Newest"         },
  { value: "alpha",    label: "A → Z"          },
];

export default function SearchFilters({ categories, cities }: SearchFiltersProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();

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
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Sort by</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam({ sort: value })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                currentSort === value
                  ? "bg-gray-900 text-white font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Category</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          <button
            onClick={() => updateParam({ category: "" })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              !currentCategory
                ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            All categories
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
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">City</h3>
        <form onSubmit={handleCitySubmit} className="flex gap-2 mb-3">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="e.g. Oslo"
            className="input py-2 px-3 text-sm flex-1"
          />
          <button type="submit" className="btn btn-primary px-3 py-2 text-xs">Go</button>
        </form>

        {/* Popular cities */}
        {cities.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">Popular cities</p>
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
            Clear city
          </button>
        )}
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={() => { setCityInput(""); router.push("/search" as any); }}
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
        >
          Reset all filters
        </button>
      )}
    </div>
  );
}
