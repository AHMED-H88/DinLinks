/**
 * Display-only formatting for city names. Capitalises the first letter of
 * each word without altering stored database values.
 *
 * - Handles multi-word names ("nord odal" -> "Nord Odal")
 * - Preserves Norwegian letters ("ålesund" -> "Ålesund")
 * - Leaves the rest of each word untouched (won't mangle "ØSTFOLD")
 * - Returns "" for empty / missing values
 */
export function formatCity(city: string | null | undefined): string {
  if (!city) return "";
  return city
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("nb-NO") + word.slice(1))
    .join(" ");
}
