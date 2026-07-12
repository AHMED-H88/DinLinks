import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface BusinessCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  categorySlug?: string;
  city: string;
  verified?: boolean;
  logo?: string | null;
  coverImage?: string | null;
  rating?: number | null;
  reviewCount?: number;
  branchCount?: number;
  highlight?: string; // search query for text highlighting
}

// ── Inline star rating ────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ── Simple inline text highlighter ───────────────────────────────────────────
function Highlighted({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-100 text-amber-900 rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function BusinessCard({
  id,
  name,
  description,
  category,
  categorySlug,
  city,
  verified = false,
  logo,
  coverImage,
  rating,
  reviewCount = 0,
  branchCount = 0,
  highlight,
}: BusinessCardProps) {
  const t = useTranslations("businessCard");
  const tCat = useTranslations("categories");
  const categoryLabel =
    categorySlug && tCat.has(categorySlug) ? tCat(categorySlug) : category;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/business/${id}`}
      className="group card card-hover flex flex-col overflow-hidden"
    >
      {/* ── Cover image / colour band ─────────────────────────────────── */}
      <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          /* subtle branded gradient when no cover */
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-gray-100" />
        )}

        {/* Logo chip, bottom-left of cover */}
        <div className="absolute bottom-3 left-4 w-11 h-11 rounded-xl border-2 border-white shadow-medium bg-white overflow-hidden flex items-center justify-center">
          {logo ? (
            <Image src={logo} alt={name} width={44} height={44} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-primary-700">{initials}</span>
          )}
        </div>

        {/* Verified badge, top-right of cover */}
        {verified && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50/90 backdrop-blur-sm border border-green-200 px-1.5 py-0.5 rounded-full">
              <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("verified")}
            </span>
          </div>
        )}
      </div>

      {/* ── Card body ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1 leading-snug mt-2">
          <Highlighted text={name} query={highlight} />
        </h3>

        {/* Category + city */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {category && (
            <span className="text-xs text-gray-500 font-medium">{categoryLabel}</span>
          )}
          {city && (
            <>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <Highlighted text={city} query={highlight} />
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
            <Highlighted text={description} query={highlight} />
          </p>
        )}

        {/* Footer: rating + branch count + arrow */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            {rating != null && rating > 0 ? (
              <div className="flex items-center gap-1.5">
                <Stars rating={rating} />
                <span className="text-xs text-gray-500">
                  {rating.toFixed(1)}
                  {reviewCount > 0 && (
                    <span className="text-gray-400 ml-0.5">({reviewCount})</span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">{t("noReviews")}</span>
            )}
            {branchCount > 1 && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                {branchCount}
              </span>
            )}
          </div>

          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
