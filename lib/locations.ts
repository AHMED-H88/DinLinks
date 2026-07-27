import type { Branch } from "@/components/BranchManager";

/**
 * Unified shape rendered by the public Locations section. It carries exactly
 * the fields the existing location card reads, so both the company's primary
 * location (built from Business fields) and additional Branch records can flow
 * through the same card without changing the card design.
 */
export interface DisplayLocation {
  key:          string;
  name:         string;
  address:      string | null;
  postalCode:   string | null;
  city:         string | null;
  phone:        string | null;
  email:        string | null;
  latitude:     number | null;
  longitude:    number | null;
  openingHours: Branch["openingHours"];
  isMain:       boolean;
}

/** Minimal subset of the Business record needed to build the primary location. */
export interface PrimaryLocationSource {
  name:       string | null;
  address:    string | null;
  city:       string | null;
  postalCode: string | null;
  phone:      string | null;
  email:      string | null;
  latitude:   number | null;
  longitude:  number | null;
}

/** Trim + lowercase + collapse internal whitespace; null-safe. */
function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Composite location key used only for duplicate detection (never displayed). */
function locationKey(
  address: string | null | undefined,
  postalCode: string | null | undefined,
  city: string | null | undefined
): string {
  return [norm(address), norm(postalCode), norm(city)].join("|");
}

/**
 * Build the final, ordered list shown in the public Locations section:
 *   1. the company's primary location (from Business fields), if it has usable
 *      location data (at least an address or a city),
 *   2. followed by the additional Branch records in their existing order.
 *
 * A Branch that resolves to the same normalized location as the primary is
 * omitted so the same place is never rendered twice. No records are mutated.
 */
export function buildDisplayLocations(
  business: PrimaryLocationSource,
  branches: Branch[]
): DisplayLocation[] {
  const result: DisplayLocation[] = [];

  const hasPrimary = Boolean(business.address?.trim() || business.city?.trim());
  const primaryKey = hasPrimary
    ? locationKey(business.address, business.postalCode, business.city)
    : null;

  if (hasPrimary) {
    result.push({
      key:          "primary",
      // A non-empty title derived only from existing data — no hardcoded text.
      name:         business.name?.trim() || business.city?.trim() || business.address?.trim() || "",
      address:      business.address ?? null,
      postalCode:   business.postalCode ?? null,
      city:         business.city ?? null,
      phone:        business.phone ?? null,
      email:        business.email ?? null,
      latitude:     business.latitude ?? null,
      longitude:    business.longitude ?? null,
      openingHours: null,
      isMain:       true,
    });
  }

  for (const branch of branches) {
    // Skip a branch that represents the same place as the primary location.
    if (primaryKey) {
      const branchKey = locationKey(branch.address, branch.postalCode, branch.city);
      if (branchKey === primaryKey) continue;
    }

    result.push({
      key:          branch.id,
      name:         branch.name,
      address:      branch.address ?? null,
      postalCode:   branch.postalCode ?? null,
      city:         branch.city ?? null,
      phone:        branch.phone ?? null,
      email:        branch.email ?? null,
      latitude:     branch.latitude ?? null,
      longitude:    branch.longitude ?? null,
      openingHours: branch.openingHours,
      // When a primary exists it is the single main location; otherwise fall
      // back to the branch's own main flag so existing behaviour is preserved.
      isMain:       hasPrimary ? false : branch.isMainBranch,
    });
  }

  return result;
}
