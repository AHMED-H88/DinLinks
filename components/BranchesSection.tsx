import { getTranslations } from "next-intl/server";
import type { Branch } from "@/components/BranchManager";
import { normalizeDayKey } from "@/lib/days";

function HoursTable({
  hours,
  labels,
  closedLabel,
}: {
  hours: Branch["openingHours"];
  labels: Record<string, string>;
  closedLabel: string;
}) {
  if (!hours || Object.keys(hours).length === 0) return null;
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden mt-3">
      {Object.entries(hours).map(([day, h], i) => (
        <div
          key={day}
          className={`flex items-center justify-between px-3 py-2 text-xs ${
            i % 2 === 0 ? "bg-gray-50" : "bg-white"
          }`}
        >
          <span className="font-medium text-gray-600 w-22">{(() => { const k = normalizeDayKey(day); return k ? labels[k] : day; })()}</span>
          {h?.closed ? (
            <span className="text-gray-400">{closedLabel}</span>
          ) : (
            <span className="text-gray-700 font-medium">
              {h?.open} – {h?.close}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

interface BranchesSectionProps {
  branches: Branch[];
  locale:   string;
}

export default async function BranchesSection({ branches, locale }: BranchesSectionProps) {
  if (branches.length === 0) return null;

  const t         = await getTranslations({ locale, namespace: "profile" });
  const tBranches = await getTranslations({ locale, namespace: "branches" });

  const DAY_LABELS: Record<string, string> = {
    monday:    t("days.monday"),
    tuesday:   t("days.tuesday"),
    wednesday: t("days.wednesday"),
    thursday:  t("days.thursday"),
    friday:    t("days.friday"),
    saturday:  t("days.saturday"),
    sunday:    t("days.sunday"),
  };

  const sorted = [...branches].sort((a, b) => {
    if (a.isMainBranch && !b.isMainBranch) return -1;
    if (!a.isMainBranch && b.isMainBranch) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <section id="branches" className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold text-gray-900">
          {t("sections.branches")}
        </h2>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {branches.length}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {sorted.map((branch) => (
          <div
            key={branch.id}
            className={`rounded-2xl border p-5 ${
              branch.isMainBranch
                ? "border-primary-200 bg-primary-50/40"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                {branch.name}
              </h3>
              {branch.isMainBranch && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {tBranches("main")}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {(branch.address || branch.city) && (
                <a
                  href={
                    branch.latitude && branch.longitude
                      ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`
                      : `https://www.google.com/maps/search/${encodeURIComponent(
                          [branch.address, branch.postalCode, branch.city].filter(Boolean).join(", ")
                        )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs text-gray-600 hover:text-primary-700 transition-colors group"
                >
                  <svg
                    className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {branch.address && <span className="block">{branch.address}</span>}
                    {(branch.postalCode || branch.city) && (
                      <span className="block text-gray-500">
                        {[branch.postalCode, branch.city].filter(Boolean).join(" ")}
                      </span>
                    )}
                  </span>
                </a>
              )}

              {branch.phone && (
                <a
                  href={`tel:${branch.phone}`}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {branch.phone}
                </a>
              )}

              {branch.email && (
                <a
                  href={`mailto:${branch.email}`}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {branch.email}
                </a>
              )}
            </div>

            {branch.openingHours && Object.keys(branch.openingHours).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t("sidebar.openingHours")}
                </p>
                <HoursTable
                  hours={branch.openingHours}
                  labels={DAY_LABELS}
                  closedLabel={t("sidebar.closed")}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
