import Link from "next/link";
import Image from "next/image";

interface BusinessCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  verified?: boolean;
  initials?: string;
  logo?: string | null;
  phone?: string;
  website?: string;
}

export default function BusinessCard({
  id,
  name,
  description,
  category,
  city,
  verified = false,
  initials,
  logo,
}: BusinessCardProps) {
  const displayInitials = initials ?? name.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/business/${id}`}
      className="group card card-hover p-6 flex flex-col gap-4"
    >
      {/* Header row */}
      <div className="flex items-start gap-4">
        {/* Logo / initials */}
        <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden bg-primary-50 border border-primary-100 flex items-center justify-center">
          {logo ? (
            <Image src={logo} alt={name} width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary-700">{displayInitials}</span>
          )}
        </div>

        {/* Name + verified */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {name}
            </h3>
            {verified && (
              <span className="badge-verified flex-shrink-0">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Verifisert
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 font-medium">{category}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {city}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">Se bedriftsprofil</span>
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
