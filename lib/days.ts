// Canonical weekday keys used across the app and in the `profile.days` /
// `businessForm.days` translation namespaces.
export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

// Historic data (and the seed) store openingHours with Norwegian day keys,
// while the business form writes English keys. Normalise either form to a
// single canonical English key so day labels and open-now checks work
// regardless of how the record was created.
const ALIASES: Record<string, DayKey> = {
  mandag: "monday",
  tirsdag: "tuesday",
  onsdag: "wednesday",
  torsdag: "thursday",
  fredag: "friday",
  lordag: "saturday",
  "lørdag": "saturday",
  sondag: "sunday",
  "søndag": "sunday",
};

/** Return the canonical English day key for a raw openingHours key, or null. */
export function normalizeDayKey(raw: string): DayKey | null {
  const key = raw.toLowerCase();
  if ((DAY_KEYS as readonly string[]).includes(key)) return key as DayKey;
  return ALIASES[key] ?? null;
}
