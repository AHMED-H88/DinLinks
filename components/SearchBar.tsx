"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface SearchBarProps {
  placeholder?: string;
}

/**
 * The params that describe which results are being looked at, and so outlive a
 * change of keyword. `SearchFilters` already carries `q` the other way when a
 * filter is clicked; this is the same relationship read from this side.
 *
 * Named rather than copied wholesale: the URL can hold anything, and forwarding
 * whatever happens to be there would let a stale or unrelated param ride along
 * into a new search.
 */
const CARRIED_PARAMS = ["category", "city", "sort"] as const;

export default function SearchBar({ placeholder }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("searchBar");

  const committedQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(committedQuery);

  // Re-seed when the committed query changes underneath the field — a back or
  // forward step, or a filter click that pushes a new URL. Keyed on the URL's
  // value, so it runs on navigation and never mid-keystroke.
  useEffect(() => setQuery(committedQuery), [committedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();

    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    for (const key of CARRIED_PARAMS) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }

    // An empty box with no filters behind it has nowhere to go. Submitting used
    // to do nothing at all in that case, and it still does — clearing the
    // keyword while a filter is set is the case that now navigates, dropping
    // `q` and leaving the filter to describe the results.
    if (!params.toString()) return;

    router.push(`/search?${params.toString()}` as any);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative flex gap-3 items-stretch">
        <div className="relative flex-1">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.15 6.15a7.5 7.5 0 0 0 10.5 10.5z" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder ?? t("placeholder")}
            className="w-full h-14 pl-14 pr-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-900 transition-all shadow-subtle bg-white"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center px-6 sm:px-10 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 active:scale-[0.98] transition-colors shadow-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
        >
          <svg className="w-5 h-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.15 6.15a7.5 7.5 0 0 0 10.5 10.5z" />
          </svg>
          <span className="hidden sm:inline">{t("button")}</span>
        </button>
      </div>
    </form>
  );
}
