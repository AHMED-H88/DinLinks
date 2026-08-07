/**
 * check:preflight-logic — fixture-based test for the preflight classifier.
 * Pure, no database. Run via tsx. Exits 1 on any failed assertion.
 */
import { classifyPreflight } from "../lib/taxonomy-v1-preflight-logic";

const EXPECTED_TEST = [
  { name: "Maaemo", fromSlug: "restaurant" },
  { name: "Elkjøp Ullevål", fromSlug: "shopping" },
  { name: "Cutters Storo", fromSlug: "tjenester" },
  { name: "TEST AS", fromSlug: "helse" },
  { name: "DAVIDOFF", fromSlug: "annet" },
];

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`  FAIL: ${msg}`);
  }
}

// ── Fixture 1: healthy pre-migration state (flat rows, annet, businesses) ──────
const cats1 = [
  { id: "c_admin", name: "Administrasjon", slug: "administrasjon", parentId: null, businessCount: 0, childCount: 0 },
  { id: "c_helse", name: "Helse", slug: "helse", parentId: null, businessCount: 1, childCount: 0 },
  { id: "c_hand", name: "Håndverk", slug: "handverk", parentId: null, businessCount: 0, childCount: 0 },
  { id: "c_annet", name: "Annet", slug: "annet", parentId: null, businessCount: 1, childCount: 0 },
  { id: "c_rest", name: "Restaurant", slug: "restaurant", parentId: null, businessCount: 1, childCount: 0 },
  { id: "c_cafe", name: "Cafe", slug: "cafe", parentId: null, businessCount: 0, childCount: 0 },
  { id: "c_shop", name: "Shopping", slug: "shopping", parentId: null, businessCount: 1, childCount: 0 },
  { id: "c_tje", name: "Tjenester", slug: "tjenester", parentId: null, businessCount: 1, childCount: 0 },
];
const biz1 = [
  { name: "Maaemo", categoryId: "c_rest", categorySlug: "restaurant", categoryParentId: null },
  { name: "Elkjøp Ullevål", categoryId: "c_shop", categorySlug: "shopping", categoryParentId: null },
  { name: "Cutters Storo", categoryId: "c_tje", categorySlug: "tjenester", categoryParentId: null },
  { name: "TEST AS", categoryId: "c_helse", categorySlug: "helse", categoryParentId: null },
  { name: "DAVIDOFF", categoryId: "c_annet", categorySlug: "annet", categoryParentId: null },
];
const r1 = classifyPreflight(cats1, biz1, EXPECTED_TEST);
assert(r1.blocking.length === 0, `healthy fixture should have no blockers, got: ${r1.blocking.join("; ")}`);
assert(r1.expected.length > 0, "healthy fixture should report expected pre-migration changes");

// ── Fixture 2: generelt present → blocking ────────────────────────────────────
const r2 = classifyPreflight([...cats1, { id: "c_gen", name: "Generelt", slug: "generelt", parentId: null, businessCount: 0, childCount: 0 }], biz1, EXPECTED_TEST);
assert(r2.blocking.some((b) => b.includes("generelt")), "generelt should be a blocker");

// ── Fixture 3: duplicate slug → blocking ──────────────────────────────────────
const r3 = classifyPreflight([...cats1, { id: "c_dup", name: "Helse 2", slug: "helse", parentId: null, businessCount: 0, childCount: 0 }], biz1, EXPECTED_TEST);
assert(r3.blocking.some((b) => b.toLowerCase().includes("duplicate slug")), "duplicate slug should be a blocker");

// ── Fixture 4: missing test business → blocking ───────────────────────────────
const r4 = classifyPreflight(cats1, biz1.filter((b) => b.name !== "TEST AS"), EXPECTED_TEST);
assert(r4.blocking.some((b) => b.includes("Missing expected test business")), "missing test business should be a blocker");

// ── Fixture 5: test business on wrong category → blocking ─────────────────────
const biz5 = biz1.map((b) => (b.name === "DAVIDOFF" ? { ...b, categorySlug: "shopping" } : b));
const r5 = classifyPreflight(cats1, biz5, EXPECTED_TEST);
assert(r5.blocking.some((b) => b.includes("DAVIDOFF")), "test business on wrong category should be a blocker");

// ── Fixture 6: a business with null categoryId → blocking ─────────────────────
const biz6 = biz1.map((b) =>
  b.name === "Maaemo" ? { ...b, categoryId: null, categorySlug: null, categoryParentId: null } : b
);
const r6b = classifyPreflight(cats1, biz6, EXPECTED_TEST);
assert(
  r6b.blocking.some((b) => b.includes('has no category assigned')),
  "a null categoryId must be a blocker"
);
// The healthy fixture (Fixture 1) has no null categories and stays blocker-free,
// which confirms expected-only state remains non-blocking (would exit 0).
assert(r1.blocking.length === 0, "expected-only state must remain non-blocking");

// ── Fixture 7: unknown slug + orphan parentId → blocking ─────────────────────
const r6 = classifyPreflight(
  [...cats1, { id: "c_x", name: "Mystery", slug: "mystery", parentId: "does_not_exist", businessCount: 0, childCount: 0 }],
  biz1,
  EXPECTED_TEST
);
assert(r6.blocking.some((b) => b.includes("Unknown slug")), "unknown slug should be a blocker");
assert(r6.blocking.some((b) => b.includes("Orphaned parentId")), "orphaned parentId should be a blocker");

if (failures > 0) {
  console.error(`\ncheck:preflight-logic — ${failures} assertion(s) FAILED.`);
  process.exit(1);
}
console.log("check:preflight-logic — OK. All classifier fixtures passed.");
