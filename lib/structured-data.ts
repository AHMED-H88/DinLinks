/**
 * Pure builders for the JSON-LD DinLinks emits. Kept free of Prisma and React
 * so every truthfulness rule is unit-testable, and so the pages contain no
 * inline schema assembly. Serialization stays with safeJsonLdString
 * (lib/jsonld.ts) at the render sites — never raw JSON.stringify.
 *
 * The governing rule for everything here: structured data may only restate
 * what is true, stored, and visible on the page. Missing means omitted,
 * never guessed.
 */

/** "HH:MM", 24h. Anything else counts as unknown and is omitted. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const SCHEMA_DAYS: Record<string, string> = {
  monday:    "https://schema.org/Monday",
  tuesday:   "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday:  "https://schema.org/Thursday",
  friday:    "https://schema.org/Friday",
  saturday:  "https://schema.org/Saturday",
  sunday:    "https://schema.org/Sunday",
};

export type StoredDayHours = { open?: unknown; close?: unknown; closed?: unknown };

export type OpeningHoursSpecification = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
};

/**
 * Truthful OpeningHoursSpecification entries from stored hours.
 *
 * - Only normalized English day keys are recognized (the caller normalizes
 *   via lib/days, tolerating legacy Norwegian keys).
 * - A day is emitted only when it is not marked closed AND both times are
 *   valid "HH:MM" strings. A missing or malformed time means unknown — the
 *   day is omitted, never filled with a guessed 09:00–17:00.
 * - Closed days are represented by omission. schema.org's explicit-closed
 *   convention (opens === closes === "00:00") states a fact the visible page
 *   expresses as a label; omission makes no claim at all and cannot disagree
 *   with the page, so it is the representation chosen here.
 */
export function buildOpeningHoursSpecification(
  orderedHours: Record<string, StoredDayHours | undefined>,
  weekDays: readonly string[],
): OpeningHoursSpecification[] {
  return weekDays.flatMap((day) => {
    const schemaDay = SCHEMA_DAYS[day];
    const h = orderedHours[day];
    if (!schemaDay || !h || h.closed) return [];
    const open  = typeof h.open  === "string" ? h.open  : "";
    const close = typeof h.close === "string" ? h.close : "";
    if (!TIME_RE.test(open) || !TIME_RE.test(close)) return [];
    return [{ "@type": "OpeningHoursSpecification" as const, dayOfWeek: schemaDay, opens: open, closes: close }];
  });
}

/**
 * The one authoritative review aggregate for a business: computed by the
 * database over the COMPLETE public review set (every stored review is
 * public — the Review model has no moderation state, and creation is already
 * auth-gated and refused for demos). Never derive an aggregate from a
 * display-capped review list.
 */
export type ReviewAggregate = { average: number | null; count: number };

export type LocalBusinessInput = {
  name: string | null;
  description: string | null;
  /** The canonical profile URL (PR-1 slug-shortId form). */
  url: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  aggregate: ReviewAggregate;
  openingHours: OpeningHoursSpecification[];
};

/**
 * LocalBusiness JSON-LD, or null when the markup would not be truthful.
 *
 * Eligibility, not decoration: Google's LocalBusiness guidance requires a
 * business name and a physical address, and neither may be fabricated or
 * placeholder-filled. A profile without both simply emits no LocalBusiness
 * markup — the page itself is unaffected. (The caller additionally restricts
 * emission to the indexable Norwegian profile of a real business; demos and
 * the noindexed EN shell emit nothing.)
 *
 * - AggregateRating appears only when real user reviews exist, valued from
 *   the complete-set aggregate — the same numbers the visible page shows.
 * - Geo is emitted only for finite values inside the real geographic ranges
 *   (latitude -90..90, longitude -180..180). The business API accepts any
 *   number, so stored values like latitude 91 exist as a possibility and
 *   must never reach the markup. 0 is a valid coordinate (truthiness would
 *   silently discard it); invalid means omitted — never clamped, never
 *   fabricated.
 */
export function buildLocalBusinessJsonLd(input: LocalBusinessInput): Record<string, unknown> | null {
  const name = input.name?.trim();
  const streetAddress = input.address?.trim();
  if (!name || !streetAddress) return null;

  const hasGeo =
    input.latitude != null && Number.isFinite(input.latitude) &&
    input.longitude != null && Number.isFinite(input.longitude) &&
    input.latitude >= -90 && input.latitude <= 90 &&
    input.longitude >= -180 && input.longitude <= 180;

  const hasAggregate = input.aggregate.average != null && input.aggregate.count > 0;

  return {
    "@context":  "https://schema.org",
    "@type":     "LocalBusiness",
    name,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    ...(input.phone ? { telephone: input.phone } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.website ? { sameAs: [input.website] } : {}),
    ...(input.logo ? { image: input.logo } : {}),
    address: {
      "@type":        "PostalAddress",
      streetAddress,
      ...(input.city ? { addressLocality: input.city } : {}),
      ...(input.postalCode ? { postalCode: input.postalCode } : {}),
      addressCountry: "NO",
    },
    ...(input.openingHours.length ? { openingHoursSpecification: input.openingHours } : {}),
    ...(hasAggregate ? {
      aggregateRating: {
        "@type":      "AggregateRating",
        // Reviews are 1–5 by validation (app/api/reviews zod schema), so the
        // 5-point scale below is the genuine DinLinks scale.
        ratingValue:  (input.aggregate.average as number).toFixed(1),
        reviewCount:  input.aggregate.count,
        bestRating:   "5",
        worstRating:  "1",
      },
    } : {}),
    ...(hasGeo ? {
      geo: { "@type": "GeoCoordinates", latitude: input.latitude, longitude: input.longitude },
    } : {}),
  };
}

export type ItemListItem = { name: string | null; url: string };

/**
 * Category ItemList JSON-LD, or null when there is nothing to list.
 *
 * - `name` is the caller's already-localized page title — the same string
 *   the visible page shows — so the markup can never disagree with the page
 *   (the caller's localization fallback, if any, applies to both equally).
 * - `numberOfItems` counts the items actually present in the markup — the
 *   page slice — not the category total: the markup must not claim more than
 *   it shows. Whether paginated pages should instead carry whole-list
 *   semantics is a pagination-policy question deferred to the pagination PR.
 * - Positions continue the visible list's numbering across pages via
 *   `positionOffset`.
 * - Zero items (empty category, or a page beyond the last) → null: an empty
 *   ItemList on a noindexed empty category says nothing worth saying.
 */
export function buildCategoryItemListJsonLd(input: {
  name: string;
  items: ItemListItem[];
  positionOffset: number;
}): Record<string, unknown> | null {
  if (input.items.length === 0) return null;
  return {
    "@context":     "https://schema.org",
    "@type":        "ItemList",
    name:            input.name,
    numberOfItems:   input.items.length,
    itemListElement: input.items.map((item, i) => ({
      "@type":  "ListItem",
      position: input.positionOffset + i + 1,
      name:     item.name ?? "",
      url:      item.url,
    })),
  };
}
