import Image from "next/image";
import { formatCity } from "@/lib/format";

export interface DashboardBusinessIdentity {
  id:           string;
  shortId:      string | null;
  isDemo:       boolean;
  name:         string | null;
  logo:         string | null;
  city:         string | null;
  status:       string;
  categorySlug: string | null;
  categoryName: string | null;
}

/**
 * The business being managed: logo, name, category · city. Shared by the
 * desktop sidebar and the mobile workspace header so both stay identical.
 * Deliberately carries nothing about the DinLinks account — no email, plan or
 * billing state — because that belongs under Account, not here.
 */
export default function DashboardIdentity({
  business,
  categoryLabel,
  compact = false,
}: {
  business:      DashboardBusinessIdentity;
  categoryLabel: string | null;
  compact?:      boolean;
}) {
  const size = compact ? "w-9 h-9" : "w-10 h-10";
  const meta = [categoryLabel, business.city ? formatCity(business.city) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`${size} rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        {business.logo ? (
          <Image src={business.logo} alt={business.name ?? ""} width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-gray-500 select-none">
            {(business.name ?? "?").slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{business.name ?? "—"}</p>
        {meta && <p className="text-xs text-gray-500 truncate">{meta}</p>}
      </div>
    </div>
  );
}
