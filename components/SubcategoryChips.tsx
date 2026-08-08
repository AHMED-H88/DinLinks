"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

// Desktop: every subcategory is always visible (natural wrapping).
// Mobile: only the first four show until the user taps "Vis alle / View all";
// tapping again ("Vis færre / Show less") collapses back. Expansion is inline —
// no modal, no navigation. Chips are neutral gray (no blue).
export default function SubcategoryChips({ subcategories }: { subcategories: Subcategory[] }) {
  const t = useTranslations("categoryPage");
  const [expanded, setExpanded] = useState(false);
  const hasMore = subcategories.length > 4;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {subcategories.map((s, i) => (
          <Link
            key={s.id}
            href={`/categories/${s.slug}`}
            className={`${
              !expanded && i >= 4 ? "hidden lg:inline-flex" : "inline-flex"
            } items-center px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-white transition-colors`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="lg:hidden mt-3 text-xs font-medium text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm"
        >
          {expanded ? t("showLess") : t("viewAll")}
        </button>
      )}
    </div>
  );
}
