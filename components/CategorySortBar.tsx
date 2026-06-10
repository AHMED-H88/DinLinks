"use client";

import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "popular",  label: "Most popular"  },
  { value: "reviewed", label: "Most reviewed"  },
  { value: "newest",   label: "Newest"         },
  { value: "alpha",    label: "A → Z"          },
];

interface CategorySortBarProps {
  currentSort: string;
  slug: string;
}

export default function CategorySortBar({ currentSort, slug }: CategorySortBarProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "popular") params.delete("sort"); else params.set("sort", value);
    params.delete("page"); // reset to page 1 when sort changes
    const qs = params.toString();
    router.push(`/categories/${slug}${qs ? `?${qs}` : ""}` as any);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Sort by</span>
      <select
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        className="input py-1.5 px-3 text-sm pr-8 cursor-pointer"
      >
        {OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
