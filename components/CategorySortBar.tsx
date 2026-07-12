"use client";

import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const OPTIONS = [
  { value: "popular",  labelKey: "mostPopular"  },
  { value: "reviewed", labelKey: "mostReviewed" },
  { value: "newest",   labelKey: "newest"       },
  { value: "alpha",    labelKey: "alphabetical" },
] as const;

interface CategorySortBarProps {
  currentSort: string;
  slug: string;
}

export default function CategorySortBar({ currentSort, slug }: CategorySortBarProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslations("categorySortBar");

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "popular") params.delete("sort"); else params.set("sort", value);
    params.delete("page"); // reset to page 1 when sort changes
    const qs = params.toString();
    router.push(`/categories/${slug}${qs ? `?${qs}` : ""}` as any);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{t("sortBy")}</span>
      <select
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        className="input py-1.5 px-3 text-sm pr-8 cursor-pointer"
      >
        {OPTIONS.map(({ value, labelKey }) => (
          <option key={value} value={value}>{t(labelKey)}</option>
        ))}
      </select>
    </div>
  );
}
