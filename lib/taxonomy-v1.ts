/**
 * DinLinks Taxonomy v1 — canonical configuration.
 *
 * Sole authority: docs/specifications/03_TAXONOMY_MASTER_LIST.md (v1.1).
 *
 * This file is the approved STRUCTURE (order, slugs, parents, display names).
 * It is NOT a runtime replacement for the database rows — the database remains
 * the source of the actual category records. This config supports seeding,
 * migration, validation, ordering and localization only.
 *
 * Two levels only: Category (top-level) -> Subcategory. No third level.
 * No `annet`, no `generelt`. Norwegian is the canonical display language;
 * English display names are mirrored into the localization files.
 */

export interface TopLevelCategory {
  slug: string;
  /** Canonical Norwegian display name (also stored as the DB `name`). */
  no: string;
  /** English display name (mirrored into messages/en.json). */
  en: string;
}

export interface SubCategory {
  slug: string;
  no: string;
  en: string;
  /** Permanent slug of the parent top-level category. */
  parent: string;
}

/** The eight approved top-level Categories, in the approved order. */
export const TOP_LEVELS: readonly TopLevelCategory[] = [
  { slug: "mat", no: "Mat", en: "Food" },
  { slug: "shopping", no: "Shopping", en: "Shopping" },
  { slug: "tjenester", no: "Tjenester", en: "Services" },
  { slug: "helse", no: "Helse", en: "Health" },
  { slug: "bil", no: "Bil", en: "Automotive" },
  { slug: "utdanning", no: "Utdanning", en: "Education" },
  { slug: "administrasjon", no: "Administrasjon", en: "Administration" },
  { slug: "dyr", no: "Dyr", en: "Animals" },
] as const;

/** All approved Subcategories, grouped under their parent, Master List order. */
export const SUBCATEGORIES: readonly SubCategory[] = [
  // Mat
  { slug: "restaurant", no: "Restaurant", en: "Restaurant", parent: "mat" },
  { slug: "cafe", no: "Kafe", en: "Cafe", parent: "mat" },
  { slug: "bakeri", no: "Bakeri", en: "Bakery", parent: "mat" },
  { slug: "bar", no: "Bar", en: "Bar", parent: "mat" },
  { slug: "catering", no: "Catering", en: "Catering", parent: "mat" },
  { slug: "gatekjokken", no: "Gatekjøkken", en: "Fast food", parent: "mat" },
  // Shopping
  { slug: "elektronikk", no: "Elektronikk", en: "Electronics", parent: "shopping" },
  { slug: "klaer", no: "Klær", en: "Clothing", parent: "shopping" },
  { slug: "dagligvare", no: "Dagligvare", en: "Grocery", parent: "shopping" },
  { slug: "mobler", no: "Møbler", en: "Furniture", parent: "shopping" },
  { slug: "smykker", no: "Smykker", en: "Jewelry", parent: "shopping" },
  { slug: "blomster", no: "Blomster", en: "Flowers", parent: "shopping" },
  { slug: "sport", no: "Sport", en: "Sports", parent: "shopping" },
  // Tjenester
  { slug: "elektriker", no: "Elektriker", en: "Electrician", parent: "tjenester" },
  { slug: "rorlegger", no: "Rørlegger", en: "Plumber", parent: "tjenester" },
  { slug: "tomrer", no: "Tømrer", en: "Carpenter", parent: "tjenester" },
  { slug: "maler", no: "Maler", en: "Painter", parent: "tjenester" },
  { slug: "renhold", no: "Renhold", en: "Cleaning", parent: "tjenester" },
  { slug: "flyttebyra", no: "Flyttebyrå", en: "Moving company", parent: "tjenester" },
  { slug: "frisor", no: "Frisør", en: "Hairdresser", parent: "tjenester" },
  { slug: "skjonnhetssalong", no: "Skjønnhetssalong", en: "Beauty salon", parent: "tjenester" },
  { slug: "lasesmed", no: "Låsesmed", en: "Locksmith", parent: "tjenester" },
  { slug: "it-tjenester", no: "IT-tjenester", en: "IT services", parent: "tjenester" },
  { slug: "handverk", no: "Håndverk", en: "General trades", parent: "tjenester" },
  // Helse
  { slug: "lege", no: "Lege", en: "Doctor", parent: "helse" },
  { slug: "tannlege", no: "Tannlege", en: "Dentist", parent: "helse" },
  { slug: "psykolog", no: "Psykolog", en: "Psychologist", parent: "helse" },
  { slug: "fysioterapeut", no: "Fysioterapeut", en: "Physiotherapist", parent: "helse" },
  { slug: "kiropraktor", no: "Kiropraktor", en: "Chiropractor", parent: "helse" },
  { slug: "optiker", no: "Optiker", en: "Optician", parent: "helse" },
  { slug: "apotek", no: "Apotek", en: "Pharmacy", parent: "helse" },
  // Bil
  { slug: "bilverksted", no: "Bilverksted", en: "Auto repair shop", parent: "bil" },
  { slug: "bilforhandler", no: "Bilforhandler", en: "Car dealer", parent: "bil" },
  { slug: "bilpleie", no: "Bilpleie", en: "Car care", parent: "bil" },
  { slug: "dekk", no: "Dekk", en: "Tires", parent: "bil" },
  { slug: "bilutleie", no: "Bilutleie", en: "Car rental", parent: "bil" },
  { slug: "eu-kontroll", no: "EU-kontroll", en: "EU inspection", parent: "bil" },
  // Utdanning
  { slug: "skole", no: "Skole", en: "School", parent: "utdanning" },
  { slug: "barnehage", no: "Barnehage", en: "Kindergarten", parent: "utdanning" },
  { slug: "sprakskole", no: "Språkskole", en: "Language school", parent: "utdanning" },
  { slug: "kurs", no: "Kurs", en: "Courses", parent: "utdanning" },
  // Administrasjon
  { slug: "advokat", no: "Advokat", en: "Lawyer", parent: "administrasjon" },
  { slug: "regnskapsforer", no: "Regnskapsfører", en: "Accountant", parent: "administrasjon" },
  { slug: "revisor", no: "Revisor", en: "Auditor", parent: "administrasjon" },
  { slug: "eiendomsmegler", no: "Eiendomsmegler", en: "Real estate agent", parent: "administrasjon" },
  { slug: "konsulent", no: "Konsulent", en: "Consultant", parent: "administrasjon" },
  { slug: "forsikring", no: "Forsikring", en: "Insurance", parent: "administrasjon" },
  // Dyr
  { slug: "veterinar", no: "Veterinær", en: "Veterinarian", parent: "dyr" },
  { slug: "dyrebutikk", no: "Dyrebutikk", en: "Pet store", parent: "dyr" },
  { slug: "hundesalong", no: "Hundesalong", en: "Dog grooming", parent: "dyr" },
  { slug: "dyrepensjonat", no: "Dyrepensjonat", en: "Pet boarding", parent: "dyr" },
] as const;

/** Homepage shortcuts — top-level Categories only, in the approved order.
 *  The Master List shows six primary shortcuts; the rest open via "Se alle
 *  kategorier". */
export const HOMEPAGE_SHORTCUT_SLUGS: readonly string[] = [
  "mat",
  "shopping",
  "tjenester",
  "helse",
  "bil",
  "administrasjon",
] as const;

/**
 * The five temporary test-business assignments used by the migration tooling.
 * These are TEMPORARY development placements (documented in the Master List) and
 * do not define real-world classification. `fromSlug` is the captured
 * pre-migration category used to detect drift before applying.
 */
export interface TestBusinessAssignment {
  name: string;
  fromSlug: string;
  toSlug: string;
  toTop: string;
}

export const TEST_BUSINESS_ASSIGNMENTS: readonly TestBusinessAssignment[] = [
  { name: "Maaemo", fromSlug: "restaurant", toSlug: "restaurant", toTop: "mat" },
  { name: "Elkjøp Ullevål", fromSlug: "shopping", toSlug: "elektronikk", toTop: "shopping" },
  { name: "Cutters Storo", fromSlug: "tjenester", toSlug: "frisor", toTop: "tjenester" },
  { name: "TEST AS", fromSlug: "helse", toSlug: "fysioterapeut", toTop: "helse" },
  { name: "DAVIDOFF", fromSlug: "annet", toSlug: "klaer", toTop: "shopping" },
] as const;

// ── Lookup maps ────────────────────────────────────────────────────────────────

const TOP_LEVEL_BY_SLUG = new Map(TOP_LEVELS.map((c) => [c.slug, c]));
const SUB_BY_SLUG = new Map(SUBCATEGORIES.map((c) => [c.slug, c]));
const TOP_LEVEL_ORDER = new Map(TOP_LEVELS.map((c, i) => [c.slug, i]));
const SUB_ORDER = new Map(SUBCATEGORIES.map((c, i) => [c.slug, i]));

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Approved sort index of a top-level slug (Infinity if unknown). */
export function topLevelOrder(slug: string): number {
  return TOP_LEVEL_ORDER.has(slug) ? (TOP_LEVEL_ORDER.get(slug) as number) : Infinity;
}

/** Approved sort index of a subcategory slug (Infinity if unknown). */
export function subOrder(slug: string): number {
  return SUB_ORDER.has(slug) ? (SUB_ORDER.get(slug) as number) : Infinity;
}

export function isTopLevelSlug(slug: string): boolean {
  return TOP_LEVEL_BY_SLUG.has(slug);
}

export function isSubcategorySlug(slug: string): boolean {
  return SUB_BY_SLUG.has(slug);
}

/** Parent top-level slug for a subcategory slug, or null. */
export function parentSlugOf(slug: string): string | null {
  return SUB_BY_SLUG.get(slug)?.parent ?? null;
}

/** Subcategories belonging to a top-level slug, in approved order. */
export function subcategoriesOf(topLevelSlug: string): SubCategory[] {
  return SUBCATEGORIES.filter((s) => s.parent === topLevelSlug);
}

/** Stable validation codes for a selected business category (used as
 *  localization keys under `businessForm.categoryErrors.*`). */
export type CategoryValidationCode =
  | "ok"
  | "missing"
  | "unknownSubcategory"
  | "topLevelNotAllowed"
  | "parentNotTopLevel"
  | "wrongParent"
  | "thirdLevel"
  | "forbidden";

/**
 * Validate that a database category row is a canonical Taxonomy v1 Subcategory
 * eligible for a business assignment. Pure — the caller supplies the row's
 * slug/parent facts (fetched with an explicit Prisma select). No I/O.
 */
export function validateSelectedSubcategory(input: {
  slug: string | null | undefined;
  parentId: string | null;
  parentSlug: string | null;
  parentParentId: string | null;
}): CategoryValidationCode {
  const { slug, parentId, parentSlug, parentParentId } = input;
  if (!slug) return "missing";
  if (slug === "annet" || slug === "generelt") return "forbidden";
  if (parentId === null) return "topLevelNotAllowed";
  if (!isSubcategorySlug(slug)) return "unknownSubcategory";
  if (!parentSlug || !isTopLevelSlug(parentSlug)) return "parentNotTopLevel";
  if (parentSlug === "annet" || parentSlug === "generelt") return "forbidden";
  if (parentParentId !== null) return "thirdLevel";
  if (parentSlugOf(slug) !== parentSlug) return "wrongParent";
  return "ok";
}

/**
 * Validate the configuration itself against the Master List invariants.
 * Returns a list of problems; empty means valid. Pure, no I/O.
 */
export function validateTaxonomyConfig(): string[] {
  const errors: string[] = [];

  if (TOP_LEVELS.length !== 8) {
    errors.push(`Expected exactly 8 top-level Categories, found ${TOP_LEVELS.length}.`);
  }

  const expectedOrder = ["mat", "shopping", "tjenester", "helse", "bil", "utdanning", "administrasjon", "dyr"];
  const actualOrder = TOP_LEVELS.map((c) => c.slug);
  if (actualOrder.join(",") !== expectedOrder.join(",")) {
    errors.push(`Top-level order mismatch. Expected [${expectedOrder.join(", ")}], got [${actualOrder.join(", ")}].`);
  }

  // Global slug uniqueness across both levels.
  const allSlugs = [...TOP_LEVELS.map((c) => c.slug), ...SUBCATEGORIES.map((c) => c.slug)];
  const seen = new Set<string>();
  for (const slug of allSlugs) {
    if (seen.has(slug)) errors.push(`Duplicate slug: ${slug}`);
    seen.add(slug);
    if (!/^[a-z0-9-]+$/.test(slug)) errors.push(`Slug is not lowercase ASCII/hyphen: ${slug}`);
  }

  // Every subcategory has exactly one valid top-level parent (no third level).
  for (const sub of SUBCATEGORIES) {
    if (!TOP_LEVEL_BY_SLUG.has(sub.parent)) {
      errors.push(`Subcategory ${sub.slug} has parent ${sub.parent} which is not a top-level Category.`);
    }
    if (SUB_BY_SLUG.has(sub.parent)) {
      errors.push(`Subcategory ${sub.slug} has a subcategory as parent (${sub.parent}) — third level not allowed.`);
    }
  }

  // Forbidden fallbacks.
  if (allSlugs.includes("annet")) errors.push("Forbidden slug present: annet");
  if (allSlugs.includes("generelt")) errors.push("Forbidden slug present: generelt");

  // Specific naming rules.
  if (TOP_LEVEL_BY_SLUG.get("mat")?.no !== "Mat") errors.push('Top-level `mat` display name must be "Mat".');
  if (SUB_BY_SLUG.get("cafe")?.no !== "Kafe") errors.push('Subcategory `cafe` display name must be "Kafe".');
  if (SUB_BY_SLUG.get("cafe")?.parent !== "mat") errors.push("`cafe` must belong to `mat`.");
  if (SUB_BY_SLUG.get("restaurant")?.parent !== "mat") errors.push("`restaurant` must belong to `mat`.");
  if (SUB_BY_SLUG.get("handverk")?.parent !== "tjenester") errors.push("`handverk` must belong to `tjenester`.");
  if (TOP_LEVEL_BY_SLUG.get("shopping")?.no !== "Shopping") errors.push('Top-level `shopping` display name must be "Shopping".');

  return errors;
}
