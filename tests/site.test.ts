import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SITE_URL,
  slugifyBusinessName,
  shortIdFromBusinessRouteParam,
  businessUrlSegment,
  businessPath,
  localeBusinessPath,
  businessUrl,
} from "../lib/site";
import { generateBusinessShortId, SHORT_ID_LENGTH } from "../lib/shortid";

// ── slugifyBusinessName ──────────────────────────────────────────────────────

test("Norwegian letters use the native ASCII convention", () => {
  assert.equal(slugifyBusinessName("Stenerud Rørservice"), "stenerud-roerservice");
  // Decomposed input (a + combining ring / e + combining acute, as macOS
  // paste produces) must fold identically to the precomposed form.
  assert.equal(slugifyBusinessName("Bla\u030Aveis Cafe\u0301"), "blaaveis-cafe");
  assert.equal(slugifyBusinessName("Bærum Såpe & Vask AS"), "baerum-saape-vask-as");
  assert.equal(slugifyBusinessName("Blåveis Café"), "blaaveis-cafe");
});

test("symbols collapse to single hyphens with no leading/trailing hyphen", () => {
  assert.equal(slugifyBusinessName("  Rør & Bad — Oslo!  "), "roer-bad-oslo");
  assert.equal(slugifyBusinessName("A/S  ---  B"), "a-s-b");
});

test("names with no sluggable characters yield an empty slug", () => {
  assert.equal(slugifyBusinessName("§§§"), "");
  assert.equal(slugifyBusinessName(""), "");
});

test("long names cap at 60 chars on a hyphen boundary", () => {
  const name = "Very Long Business Name That Keeps Going And Going And Going Yes";
  const slug = slugifyBusinessName(name);
  assert.ok(slug.length <= 60, `len ${slug.length}`);
  assert.ok(!slug.endsWith("-"));
  assert.ok(!slug.includes("--"));
});

// ── shortIdFromBusinessRouteParam ────────────────────────────────────────────

test("canonical, stale-slug and bare forms all yield the shortId", () => {
  assert.equal(shortIdFromBusinessRouteParam("stenerud-roerservice-k7x2f9m4qd"), "k7x2f9m4qd");
  assert.equal(shortIdFromBusinessRouteParam("old-name-k7x2f9m4qd"), "k7x2f9m4qd");
  assert.equal(shortIdFromBusinessRouteParam("k7x2f9m4qd"), "k7x2f9m4qd");
});

test("legacy cuids and demo ids yield null (fall through to exact-id)", () => {
  assert.equal(shortIdFromBusinessRouteParam("cmf3xk2p400001234567890ab"), null);
  assert.equal(shortIdFromBusinessRouteParam("demo-ror-og-bad"), null);
  assert.equal(shortIdFromBusinessRouteParam("demo-harstudio"), null);
  assert.equal(shortIdFromBusinessRouteParam("demo-bakeri-og-kafe"), null);
});

test("a 10-char name fragment matches the pattern (safety is lookup-miss fallthrough)", () => {
  // Documented behavior: this returns a candidate; the DB lookup misses and
  // resolution falls through to exact id, then 404.
  assert.equal(shortIdFromBusinessRouteParam("stenerud-rorservice"), "rorservice");
});

test("wrong-length or wrong-charset tails yield null", () => {
  assert.equal(shortIdFromBusinessRouteParam("name-shortid9"), null); // 8 chars
  assert.equal(shortIdFromBusinessRouteParam("name-K7X2F9M4QD"), null); // uppercase
  assert.equal(shortIdFromBusinessRouteParam("name-k7x2f9m4q_"), null); // charset
});

// ── businessUrlSegment / paths ───────────────────────────────────────────────

const real = { id: "cmf3xk2p400001234567890ab", name: "Stenerud Rørservice", shortId: "k7x2f9m4qd", isDemo: false };

test("real business with shortId gets slug-shortId; round-trips through the parser", () => {
  const segment = businessUrlSegment(real);
  assert.equal(segment, "stenerud-roerservice-k7x2f9m4qd");
  assert.equal(shortIdFromBusinessRouteParam(segment), real.shortId);
  assert.equal(businessPath(real), `/business/${segment}`);
  assert.equal(localeBusinessPath("no", real), `/no/business/${segment}`);
  // Expected origin comes from SITE_URL itself so the test holds in any
  // environment where NEXT_PUBLIC_SITE_URL is set.
  assert.equal(businessUrl("no", real), `${SITE_URL}/no/business/${segment}`);
});

test("nameless business canonicalizes to the bare shortId", () => {
  assert.equal(businessUrlSegment({ ...real, name: null }), "k7x2f9m4qd");
});

test("demo profiles always keep their id, even with a shortId present", () => {
  assert.equal(businessUrlSegment({ id: "demo-ror-og-bad", name: "Eksempel Rør og Bad AS", shortId: "k7x2f9m4qd", isDemo: true }), "demo-ror-og-bad");
});

test("rows without a shortId fall back to their id", () => {
  assert.equal(businessUrlSegment({ ...real, shortId: null }), real.id);
});

// ── generateBusinessShortId ──────────────────────────────────────────────────

test("generated shortIds are 10 lowercase alphanumerics and parseable", () => {
  for (let i = 0; i < 200; i++) {
    const sid = generateBusinessShortId();
    assert.equal(sid.length, SHORT_ID_LENGTH);
    assert.match(sid, /^[a-z0-9]{10}$/);
    assert.equal(shortIdFromBusinessRouteParam(sid), sid);
  }
});
