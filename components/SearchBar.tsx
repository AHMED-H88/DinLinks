"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder }: SearchBarProps) {
  const router = useRouter();
  const t = useTranslations("searchBar");
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
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
            className="w-full h-14 pl-14 pr-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-primary-500 transition-all shadow-subtle bg-white"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg px-10 shadow-subtle rounded-xl"
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
