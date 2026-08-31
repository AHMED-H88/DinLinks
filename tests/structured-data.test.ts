import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOpeningHoursSpecification,
  buildLocalBusinessJsonLd,
  buildCategoryItemListJsonLd,
  type LocalBusinessInput,
} from "../lib/structured-data";
import { safeJsonLdString } from "../lib/jsonld";

const WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

// ── Opening hours: truthfulness ──────────────────────────────────────────────

test("valid stored times are emitted verbatim, in week order", () => {
  const spec = buildOpeningHoursSpecification(
    { monday: { open: "08:30", close: "16:00" }, friday: { open: "10:00", close: "14:00" } },
    WEEK,
  );
  assert.deepEqual(spec.map((s) => [s.dayOfWeek, s.opens, s.closes]), [
    ["https://schema.org/Monday", "08:30", "16:00"],
    ["https://schema.org/Friday", "10:00", "14:00"],
  ]);
});

test("a missing time means unknown: the day is omitted, never 09:00-17:00", () => {
  const spec = buildOpeningHoursSpecification(
    { monday: { open: "08:00" }, tuesday: { close: "17:30" }, wednesday: {} },
    WEEK,
  );
  assert.deepEqual(spec, []);
  assert.ok(!JSON.stringify(spec).includes("09:00"), "no fabricated default may appear");
});

test("malformed times are omitted", () => {
  const spec = buildOpeningHoursSpecification(
    {
      monday:    { open: "9:00",  close: "17:00" },  // missing leading zero
      tuesday:   { open: "25:00", close: "17:00" },  // invalid hour
      wednesday: { open: 900,     close: "17:00" },  // non-string
      thursday:  { open: "08:00", close: "17:60" },  // invalid minutes
    },
    WEEK,
  );
  assert.deepEqual(spec, []);
});

test("closed days are represented by omission", () => {
  const spec = buildOpeningHoursSpecification(
    { monday: { open: "08:00", close: "16:00", closed: true }, tuesday: { open: "08:00", close: "16:00" } },
    WEEK,
  );
  assert.equal(spec.length, 1);
  assert.equal(spec[0].dayOfWeek, "https://schema.org/Tuesday");
});

test("unrecognized day keys are ignored", () => {
  const spec = buildOpeningHoursSpecification(
    { mandag: { open: "08:00", close: "16:00" } },
    ["mandag"],
  );
  assert.deepEqual(spec, []);
});

// ── LocalBusiness: eligibility and truthfulness ──────────────────────────────

function realInput(overrides: Partial<LocalBusinessInput> = {}): LocalBusinessInput {
  return {
    name: "Stenerud Rørservice",
    description: "Rørlegger i Lørenskog.",
    url: "https://www.dinlinks.com/no/business/stenerud-roerservice-k7x2f9m4qd",
    phone: "+47 12 34 56 78",
    email: "post@stenerud.no",
    website: "https://stenerud.no",
    logo: "https://cdn.example/logo.png",
    address: "Testveien 1",
    city: "Lørenskog",
    postalCode: "1470",
    latitude: 59.93,
    longitude: 10.95,
    aggregate: { average: 4.2, count: 25 },
    openingHours: buildOpeningHoursSpecification({ monday: { open: "08:00", close: "16:00" } }, WEEK),
    ...overrides,
  };
}

test("no name or no physical address means no LocalBusiness markup at all", () => {
  assert.equal(buildLocalBusinessJsonLd(realInput({ name: null })), null);
  assert.equal(buildLocalBusinessJsonLd(realInput({ name: "   " })), null);
  assert.equal(buildLocalBusinessJsonLd(realInput({ address: null })), null);
  assert.equal(buildLocalBusinessJsonLd(realInput({ address: "" })), null);
});

test("full input produces a complete, truthful LocalBusiness node", () => {
  const node = buildLocalBusinessJsonLd(realInput())!;
  assert.equal(node["@type"], "LocalBusiness");
  assert.equal(node.name, "Stenerud Rørservice");
  assert.deepEqual(node.address, {
    "@type": "PostalAddress",
    streetAddress: "Testveien 1",
    addressLocality: "Lørenskog",
    postalCode: "1470",
    addressCountry: "NO",
  });
  assert.deepEqual(node.aggregateRating, {
    "@type": "AggregateRating",
    ratingValue: "4.2",
    reviewCount: 25,
    bestRating: "5",
    worstRating: "1",
  });
  assert.deepEqual(node.geo, { "@type": "GeoCoordinates", latitude: 59.93, longitude: 10.95 });
  // Syntactically valid JSON end to end.
  assert.equal(JSON.parse(safeJsonLdString(node))["name"], "Stenerud Rørservice");
});

test("zero reviews means no aggregateRating key", () => {
  const node = buildLocalBusinessJsonLd(realInput({ aggregate: { average: null, count: 0 } }))!;
  assert.ok(!("aggregateRating" in node));
});

test("geo: 0 is a valid coordinate; null means absent; nothing is fabricated", () => {
  const zero = buildLocalBusinessJsonLd(realInput({ latitude: 0, longitude: 0 }))!;
  assert.deepEqual(zero.geo, { "@type": "GeoCoordinates", latitude: 0, longitude: 0 });
  const missing = buildLocalBusinessJsonLd(realInput({ latitude: null, longitude: 10.95 }))!;
  assert.ok(!("geo" in missing));
});

test("NaN coordinates are excluded, and averages round to one decimal", () => {
  const nan = buildLocalBusinessJsonLd(realInput({ latitude: NaN, longitude: 10.95 }))!;
  assert.ok(!("geo" in nan));
  const rounded = buildLocalBusinessJsonLd(realInput({ aggregate: { average: 4.666, count: 3 } }))!;
  assert.equal((rounded.aggregateRating as { ratingValue: string }).ratingValue, "4.7");
});

test("SEC-1 regression: owner text cannot break out of the script element", () => {
  const node = buildLocalBusinessJsonLd(realInput({
    name: 'Evil AS</script><script>alert("x")</script>',
    description: "a </ScRiPt> b",
  }))!;
  const out = safeJsonLdString(node);
  assert.ok(!out.toLowerCase().includes("</script"));
  assert.ok(!out.includes("<"));
});

// ── Category ItemList ────────────────────────────────────────────────────────

test("empty item list emits nothing", () => {
  assert.equal(buildCategoryItemListJsonLd({ name: "Rørlegger-bedrifter i Norge", items: [], positionOffset: 0 }), null);
});

test("numberOfItems counts the marked-up items and positions continue across pages", () => {
  const node = buildCategoryItemListJsonLd({
    name: "Plumber businesses in Norway",
    items: [
      { name: "A", url: "https://www.dinlinks.com/en/business/a-1234567890" },
      { name: null, url: "https://www.dinlinks.com/en/business/b-0987654321" },
    ],
    positionOffset: 12,
  })!;
  assert.equal(node.numberOfItems, 2);
  const els = node.itemListElement as Array<{ position: number; name: string }>;
  assert.deepEqual(els.map((e) => e.position), [13, 14]);
  assert.equal(els[1].name, "");
  assert.equal(node.name, "Plumber businesses in Norway");
});
