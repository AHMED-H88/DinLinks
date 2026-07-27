/**
 * Phase 1 · Step A1 — Business information foundation.
 *
 * Shared allow-lists, normalisers and validators for the new optional Business
 * fields. Imported by BOTH the API route (authoritative server-side validation)
 * and the BusinessForm (option lists). Keeping them here prevents the whitelist
 * from drifting between client and server.
 */

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

export const SERVICE_MODES = ["ON_SITE", "REMOTE", "NATIONWIDE"] as const;
export type ServiceMode = (typeof SERVICE_MODES)[number];

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

const FOUNDED_YEAR_MIN = 1800;

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

  return errors.length ? { ok: false, errors } : { ok: true, data };
}
