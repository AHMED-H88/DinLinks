/**
 * Phase 1 · Step A1 — Business information foundation.
 *
 * Shared allow-lists, normalisers and validators for the new optional Business
 * fields. Imported by BOTH the API route (authoritative server-side validation)
 * and the BusinessForm (option lists). Keeping them here prevents the whitelist
 * from drifting between client and server.
 */

import { isValidDateString } from "@/lib/holidays";

// ── Controlled value sets ─────────────────────────────────────────────────────

export const COMPANY_SIZES = [
  "SELF_EMPLOYED",
  "MICRO",
  "SMALL",
  "MEDIUM",
  "LARGE",
  "ENTERPRISE",
] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

/**
 * Legacy — the single list that mixed *how* a service is delivered with *how
 * far* it reaches. Superseded by DELIVERY_METHODS + SERVICE_AREAS. Retained
 * because the column still exists and old rows still hold these values.
 */
export const SERVICE_MODES = ["ON_SITE", "REMOTE", "NATIONWIDE"] as const;
export type ServiceMode = (typeof SERVICE_MODES)[number];

/** How the service reaches the customer. Multi-select: a business can do several. */
export const DELIVERY_METHODS = [
  "ON_SITE",
  "AT_CUSTOMER",
  "DIGITAL",
  "PICKUP",
  "DELIVERY",
] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

/**
 * How far the business serves. Single-select rather than multi: the three are
 * nested, so picking both "Lokalt" and "Hele Norge" states nothing extra and
 * only invites contradictory profiles.
 */
export const SERVICE_AREAS = ["LOCAL", "REGIONAL", "NATIONWIDE"] as const;
export type ServiceArea = (typeof SERVICE_AREAS)[number];

/**
 * The fields a business may keep off its public profile — "public by default,
 * private by choice". Deliberately excluded: name and category, without which
 * the profile means nothing, and city, which is the directory's locality
 * signal and is what search and the business cards are built on. A business
 * that will not receive customers can hide the street address and postcode
 * and still be findable in the right place.
 */
export const HIDEABLE_FIELDS = [
  "foundedYear",
  "employeeCount",
  "companySize",
  "legalName",
  "organizationNumber",
  "organizationType",
  "address",
  "postalCode",
  "phone",
  "email",
  "website",
] as const;
export type HideableField = (typeof HIDEABLE_FIELDS)[number];

/**
 * How an item's price is presented. Not every business quotes a number, and
 * forcing one produces either a fiction or an empty field.
 */
export const PRICE_MODES = ["NONE", "FIXED", "FROM", "ON_REQUEST"] as const;
export type PriceMode = (typeof PRICE_MODES)[number];

/** What an exceptional date does to that day's hours. */
export const EXCEPTIONAL_MODES = ["SAME", "CLOSED", "CUSTOM"] as const;
export type ExceptionalMode = (typeof EXCEPTIONAL_MODES)[number];

export const HIGHLIGHT_CODES = [
  "FREE_ESTIMATE",
  "EMERGENCY_SERVICE",
  "FAMILY_OWNED",
  "CERTIFIED_PROFESSIONALS",
  "ECO_FRIENDLY",
  "WEEKEND_SERVICE",
  "FAST_RESPONSE",
  "MOBILE_SERVICE",
  "NATIONWIDE_SERVICE",
  "REMOTE_SERVICE",
] as const;
export type HighlightCode = (typeof HIGHLIGHT_CODES)[number];

/** Earliest accepted founding year. Exported so the client form validates
 *  against the same bound the API enforces. */
export const FOUNDED_YEAR_MIN = 1800;

/** Application-level max length for the short business identity summary. */
export const IDENTITY_SUMMARY_MAX = 180;

// ── Owner-authored content limits ─────────────────────────────────────────────
// Bounds rather than product features: they stop one profile from making the
// public page unreadable, and stop an unbounded array reaching the database.

export const HIGHLIGHT_MAX_LENGTH  = 60;
export const HIGHLIGHT_MAX_COUNT   = 12;

export const PRIMARY_ACTION_LABEL_MAX = 32;

export const SERVICE_NAME_MAX        = 120;
export const SERVICE_DESCRIPTION_MAX = 600;
export const SERVICE_PRICE_MAX       = 40;
export const SERVICE_LINK_LABEL_MAX  = 40;
export const SERVICE_MAX_COUNT       = 100;

export const EXCEPTIONAL_HOURS_MAX_COUNT = 60;
export const EXCEPTIONAL_LABEL_MAX       = 60;

/** `HH:MM`, 24-hour — the shape every time input produces. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// ── Custom highlights ─────────────────────────────────────────────────────────

/**
 * One owner-authored highlight, in both site languages.
 *
 * Either side may be null: a business that writes only Norwegian has written
 * only Norwegian, and inventing the English is not this system's job. What the
 * public profile does with a missing side is a rendering decision, made once in
 * `pickHighlight` below rather than scattered across the pages.
 */
export interface HighlightItem {
  no: string | null;
  en: string | null;
}

/**
 * Normalize a stored highlights value. Order is meaning — it is the display
 * order the owner arranged — so entries are never sorted, only filtered.
 *
 * A bare string is accepted as Norwegian-only. Nothing in the database has
 * that shape (this column ships bilingual from its first migration), but it
 * costs one branch and makes hand-written or imported JSON survive intact
 * rather than silently vanishing.
 */
export function normalizeHighlights(raw: unknown): HighlightItem[] {
  if (!Array.isArray(raw)) return [];

  const text = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, HIGHLIGHT_MAX_LENGTH) : null;

  return raw
    .slice(0, HIGHLIGHT_MAX_COUNT)
    .map((item): HighlightItem | null => {
      if (typeof item === "string") return { no: text(item), en: null };
      if (typeof item !== "object" || item === null) return null;
      const r = item as Record<string, unknown>;
      return { no: text(r.no), en: text(r.en) };
    })
    // An entry with neither language is an empty row, not a highlight.
    .filter((h): h is HighlightItem => h !== null && (h.no !== null || h.en !== null));
}

/**
 * The text to show for a highlight on a page in `locale`.
 *
 * Falls back to the other language rather than dropping the entry. That is not
 * a translation and is not presented as one — it is the business's own words,
 * shown as written. The alternative, hiding anything the owner wrote in only
 * one language, would empty the section for half the audience and quietly lose
 * real content. Returns null only when the entry holds nothing at all.
 */
export function pickHighlight(item: HighlightItem, locale: string): string | null {
  return locale === "en"
    ? item.en ?? item.no
    : item.no ?? item.en;
}

// ── Service items ─────────────────────────────────────────────────────────────

/**
 * One item in a business's Services list. Every field beyond id and name is
 * optional, because a restaurant dish, a carpenter's service and a consultant's
 * offer genuinely need different subsets — the business decides which apply.
 *
 * Stored in the `services` JSON column, so the shape can grow without a
 * migration. Items written by earlier versions have only id/name/description/
 * price; `normalizeServiceItem` fills the rest in, so nothing has to be
 * rewritten in the database to keep working.
 */
export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  /** The number or phrase shown, for FIXED and FROM. Empty otherwise. */
  price: string;
  priceMode: PriceMode;
  image: string | null;
  link: string | null;
  /** The owner's wording for `link`; falls back to a localized default. */
  linkLabel: string | null;
  /** Kept in the editor but withheld from the public profile. */
  hidden: boolean;
}

/**
 * Bring an item of unknown vintage up to the current shape.
 *
 * The one inference that matters: an item saved before price modes existed has
 * a price string and no mode. A non-empty price meant a fixed price, so that is
 * what it becomes — reading it as "no price" would silently blank prices that
 * businesses already publish.
 */
export function normalizeServiceItem(raw: unknown, index: number): ServiceItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const str = (v: unknown, max: number): string =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const nullable = (v: unknown, max: number): string | null =>
    str(v, max) || null;

  const price = str(r.price, SERVICE_PRICE_MAX);

  const priceMode: PriceMode =
    typeof r.priceMode === "string" && (PRICE_MODES as readonly string[]).includes(r.priceMode)
      ? (r.priceMode as PriceMode)
      : price
        ? "FIXED" // legacy item with a price — see above
        : "NONE";

  return {
    id:          typeof r.id === "string" && r.id ? r.id : `svc-${index}`,
    name:        str(r.name, SERVICE_NAME_MAX),
    description: str(r.description, SERVICE_DESCRIPTION_MAX),
    // A mode that carries no number must not keep a stale one around.
    price:       priceMode === "FIXED" || priceMode === "FROM" ? price : "",
    priceMode,
    image:       nullable(r.image, 2048),
    link:        nullable(r.link, 2048),
    linkLabel:   nullable(r.linkLabel, SERVICE_LINK_LABEL_MAX),
    hidden:      r.hidden === true,
  };
}

/** Normalize a whole stored list, dropping unusable entries. Order is meaning. */
export function normalizeServiceItems(raw: unknown): ServiceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, SERVICE_MAX_COUNT)
    .map((item, i) => normalizeServiceItem(item, i))
    .filter((item): item is ServiceItem => item !== null && item.name.length > 0);
}

// ── Exceptional opening hours ─────────────────────────────────────────────────

/**
 * One date whose hours differ from the weekly schedule — a public holiday or a
 * one-off. `holiday` records which generated holiday the entry came from, so
 * the public profile can name the day without storing a language in the data.
 */
export interface ExceptionalHoursEntry {
  /** `YYYY-MM-DD` */
  date: string;
  mode: ExceptionalMode;
  /** `HH:MM`, only meaningful when mode is CUSTOM. */
  open: string | null;
  close: string | null;
  /** The owner's name for a custom date. Null for generated holidays. */
  label: string | null;
  /** A `HolidayKey` when this date is a public holiday, else null. */
  holiday: string | null;
}

export function normalizeExceptionalHours(raw: unknown): ExceptionalHoursEntry[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const out: ExceptionalHoursEntry[] = [];

  for (const item of raw.slice(0, EXCEPTIONAL_HOURS_MAX_COUNT)) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;

    const date = typeof r.date === "string" ? r.date.trim() : "";
    // One entry per date: a day cannot both be closed and keep custom hours.
    if (!date || seen.has(date)) continue;

    const mode: ExceptionalMode =
      typeof r.mode === "string" && (EXCEPTIONAL_MODES as readonly string[]).includes(r.mode)
        ? (r.mode as ExceptionalMode)
        : "SAME";

    const time = (v: unknown): string | null =>
      typeof v === "string" && TIME_RE.test(v.trim()) ? v.trim() : null;

    const open  = mode === "CUSTOM" ? time(r.open)  : null;
    const close = mode === "CUSTOM" ? time(r.close) : null;

    // Custom hours with no usable pair say nothing; drop rather than render
    // an entry the public profile could not display.
    if (mode === "CUSTOM" && (!open || !close)) continue;

    seen.add(date);
    out.push({
      date,
      mode,
      open,
      close,
      label:   typeof r.label   === "string" && r.label.trim()   ? r.label.trim().slice(0, EXCEPTIONAL_LABEL_MAX) : null,
      holiday: typeof r.holiday === "string" && r.holiday.trim() ? r.holiday.trim() : null,
    });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Result helper ─────────────────────────────────────────────────────────────

export type FieldError = { field: string; message: string };

// ── Individual normaliser/validators (also usable client-side) ────────────────

/** Strip whitespace from a Norwegian org number → expect exactly 9 digits. */
export function normalizeOrgNumber(raw: string): string {
  return raw.replace(/\s+/g, "");
}
export function isValidOrgNumber(normalized: string): boolean {
  return /^\d{9}$/.test(normalized);
}

/** Deduplicate + preserve order for controlled string lists. */
function dedupe<T>(list: T[]): T[] {
  return Array.from(new Set(list));
}

// ── Server-side extraction + validation ───────────────────────────────────────

/**
 * Validate & normalise ONLY the Step A1 fields from an untrusted request body.
 * Returns either the exact Prisma-ready subset or a list of field errors.
 * Fields absent from the body are treated as "leave unset" (undefined) so that
 * existing clients which don't send them keep working unchanged.
 */
export function validateBusinessExtras(
  body: Record<string, unknown>
): { ok: true; data: Record<string, unknown> } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const data: Record<string, unknown> = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

  // companyStory — optional long text
  if (has("companyStory")) {
    const v = body.companyStory;
    if (v === null || v === "") data.companyStory = null;
    else if (typeof v === "string") data.companyStory = v.trim() || null;
    else errors.push({ field: "companyStory", message: "invalidType" });
  }

  // identitySummaryNo / identitySummaryEn — optional short factual statement.
  // Trimmed; empty stored as null; capped at IDENTITY_SUMMARY_MAX characters.
  for (const key of ["identitySummaryNo", "identitySummaryEn"] as const) {
    if (!has(key)) continue;
    const v = body[key];
    if (v === null || v === "") {
      data[key] = null;
    } else if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.length === 0) data[key] = null;
      else if (trimmed.length > IDENTITY_SUMMARY_MAX) {
        errors.push({ field: key, message: "identitySummaryTooLong" });
      } else data[key] = trimmed;
    } else {
      errors.push({ field: key, message: "invalidType" });
    }
  }

  // legalName — optional string
  if (has("legalName")) {
    const v = body.legalName;
    if (v === null || v === "") data.legalName = null;
    else if (typeof v === "string") data.legalName = v.trim() || null;
    else errors.push({ field: "legalName", message: "invalidType" });
  }

  // organizationType — optional free string (open — multi-country)
  if (has("organizationType")) {
    const v = body.organizationType;
    if (v === null || v === "") data.organizationType = null;
    else if (typeof v === "string") data.organizationType = v.trim() || null;
    else errors.push({ field: "organizationType", message: "invalidType" });
  }

  // foundedYear — optional int 1800..currentYear
  if (has("foundedYear")) {
    const v = body.foundedYear;
    if (v === null || v === "") {
      data.foundedYear = null;
    } else {
      const n = typeof v === "number" ? v : Number(v);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(n) || n < FOUNDED_YEAR_MIN || n > currentYear) {
        errors.push({ field: "foundedYear", message: "foundedYearRange" });
      } else {
        data.foundedYear = n;
      }
    }
  }

  // employeeCount — optional non-negative int
  if (has("employeeCount")) {
    const v = body.employeeCount;
    if (v === null || v === "") {
      data.employeeCount = null;
    } else {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isInteger(n) || n < 0) {
        errors.push({ field: "employeeCount", message: "employeeCountRange" });
      } else {
        data.employeeCount = n;
      }
    }
  }

  // companySize — optional enum
  if (has("companySize")) {
    const v = body.companySize;
    if (v === null || v === "") data.companySize = null;
    else if (typeof v === "string" && (COMPANY_SIZES as readonly string[]).includes(v)) {
      data.companySize = v;
    } else errors.push({ field: "companySize", message: "companySizeInvalid" });
  }

  // organizationNumber — optional, normalised to 9 digits
  if (has("organizationNumber")) {
    const v = body.organizationNumber;
    if (v === null || v === "") {
      data.organizationNumber = null;
    } else if (typeof v === "string") {
      const norm = normalizeOrgNumber(v);
      if (!isValidOrgNumber(norm)) {
        errors.push({ field: "organizationNumber", message: "orgNumberInvalid" });
      } else {
        data.organizationNumber = norm;
      }
    } else {
      errors.push({ field: "organizationNumber", message: "invalidType" });
    }
  }

  // serviceModes — optional list of allowed codes
  if (has("serviceModes")) {
    const v = body.serviceModes;
    if (v === null) {
      data.serviceModes = [];
    } else if (Array.isArray(v)) {
      const vals = v.map((x) => (typeof x === "string" ? x.trim() : ""));
      const invalid = vals.filter((c) => !(SERVICE_MODES as readonly string[]).includes(c));
      if (invalid.length) {
        errors.push({ field: "serviceModes", message: "serviceModesInvalid" });
      } else {
        data.serviceModes = dedupe(vals);
      }
    } else {
      errors.push({ field: "serviceModes", message: "invalidType" });
    }
  }

  // highlightCodes — optional list of allowed codes
  if (has("highlightCodes")) {
    const v = body.highlightCodes;
    if (v === null) {
      data.highlightCodes = [];
    } else if (Array.isArray(v)) {
      const vals = v.map((x) => (typeof x === "string" ? x.trim() : ""));
      const invalid = vals.filter((c) => !(HIGHLIGHT_CODES as readonly string[]).includes(c));
      if (invalid.length) {
        errors.push({ field: "highlightCodes", message: "highlightCodesInvalid" });
      } else {
        data.highlightCodes = dedupe(vals);
      }
    } else {
      errors.push({ field: "highlightCodes", message: "invalidType" });
    }
  }

  // hiddenFields — which hideable fields the owner keeps off the public page.
  // An unknown name is rejected rather than ignored: silently dropping it would
  // publish a field the owner believes is hidden.
  if (has("hiddenFields")) {
    const v = body.hiddenFields;
    if (v === null) {
      data.hiddenFields = [];
    } else if (Array.isArray(v)) {
      const vals = v.map((x) => (typeof x === "string" ? x.trim() : ""));
      if (vals.some((f) => !(HIDEABLE_FIELDS as readonly string[]).includes(f))) {
        errors.push({ field: "hiddenFields", message: "hiddenFieldsInvalid" });
      } else {
        data.hiddenFields = dedupe(vals);
      }
    } else {
      errors.push({ field: "hiddenFields", message: "invalidType" });
    }
  }

  // deliveryMethods — optional list of allowed codes
  if (has("deliveryMethods")) {
    const v = body.deliveryMethods;
    if (v === null) {
      data.deliveryMethods = [];
    } else if (Array.isArray(v)) {
      const vals = v.map((x) => (typeof x === "string" ? x.trim() : ""));
      if (vals.some((c) => !(DELIVERY_METHODS as readonly string[]).includes(c))) {
        errors.push({ field: "deliveryMethods", message: "deliveryMethodsInvalid" });
      } else {
        data.deliveryMethods = dedupe(vals);
      }
    } else {
      errors.push({ field: "deliveryMethods", message: "invalidType" });
    }
  }

  // serviceArea — optional single code
  if (has("serviceArea")) {
    const v = body.serviceArea;
    if (v === null || v === "") data.serviceArea = null;
    else if (typeof v === "string" && (SERVICE_AREAS as readonly string[]).includes(v)) {
      data.serviceArea = v;
    } else errors.push({ field: "serviceArea", message: "serviceAreaInvalid" });
  }

  // highlights — owner-authored bilingual free text, order preserved. Blank
  // entries are dropped rather than rejected: an empty row the owner never
  // filled in is a half-finished edit, not a mistake worth blocking a save for.
  // Over-length text IS rejected, because silently truncating someone's words
  // is worse than telling them the limit.
  if (has("highlights")) {
    const v = body.highlights;
    if (v === null) {
      data.highlights = [];
    } else if (Array.isArray(v)) {
      const tooLong = v.some((item) => {
        if (typeof item === "string") return item.trim().length > HIGHLIGHT_MAX_LENGTH;
        if (typeof item !== "object" || item === null) return false;
        const r = item as Record<string, unknown>;
        return (["no", "en"] as const).some(
          (k) => typeof r[k] === "string" && (r[k] as string).trim().length > HIGHLIGHT_MAX_LENGTH
        );
      });
      if (tooLong) {
        errors.push({ field: "highlights", message: "highlightTooLong" });
      } else if (v.length > HIGHLIGHT_MAX_COUNT) {
        errors.push({ field: "highlights", message: "highlightsTooMany" });
      } else {
        data.highlights = normalizeHighlights(v);
      }
    } else {
      errors.push({ field: "highlights", message: "invalidType" });
    }
  }

  // primaryActionLabelNo / primaryActionLabelEn — the owner's wording for
  // bookingLink, per language. The URL itself is unchanged and still validated
  // with the other links. A language left blank stays blank: the public profile
  // falls back to its own localized default rather than to the other language,
  // so an English visitor never meets a Norwegian button.
  for (const key of ["primaryActionLabelNo", "primaryActionLabelEn"] as const) {
    if (!has(key)) continue;
    const v = body[key];
    if (v === null || v === "") {
      data[key] = null;
    } else if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.length > PRIMARY_ACTION_LABEL_MAX) {
        errors.push({ field: key, message: "primaryActionLabelTooLong" });
      } else data[key] = trimmed || null;
    } else {
      errors.push({ field: key, message: "invalidType" });
    }
  }

  // mapLink — no longer offered in the editor: the public profile builds its
  // maps link from coordinates or the address. Still accepted so a stored value
  // survives, and absent from a request means "leave as is" rather than "clear".
  if (has("mapLink")) {
    const v = body.mapLink;
    if (v === null || v === "") data.mapLink = null;
    else if (typeof v === "string") data.mapLink = v.trim() || null;
    else errors.push({ field: "mapLink", message: "invalidType" });
  }

  // services — normalised rather than rejected. The shape is owner-authored
  // JSON that has changed across versions, so the server's job is to bring it
  // to the current shape, not to fail a save over an old field.
  if (has("services")) {
    const v = body.services;
    if (v === null) data.services = [];
    else if (Array.isArray(v)) data.services = normalizeServiceItems(v);
    else errors.push({ field: "services", message: "invalidType" });
  }

  // exceptionalHours — holidays and one-off dates. Dates are checked against
  // the calendar, not just the pattern, so 31 February never reaches the page.
  if (has("exceptionalHours")) {
    const v = body.exceptionalHours;
    if (v === null) {
      data.exceptionalHours = [];
    } else if (Array.isArray(v)) {
      const normalized = normalizeExceptionalHours(v);
      if (normalized.some((e) => !isValidDateString(e.date))) {
        errors.push({ field: "exceptionalHours", message: "exceptionalDateInvalid" });
      } else {
        data.exceptionalHours = normalized;
      }
    } else {
      errors.push({ field: "exceptionalHours", message: "invalidType" });
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, data };
}
