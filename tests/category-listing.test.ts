import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCategoryListingQuery,
  categoryTargetIds,
  canonicalCategorySearch,
  CATEGORY_PAGE_SIZE,
} from "../lib/category-listing";

// ── Valid canonical forms: no redirect ───────────────────────────────────────

test("missing params mean page 1, popular, canonical bare URL, no redirect", () => {
  const q = parseCategoryListingQuery({})!;
  assert.deepEqual(
    { page: q.page, sort: q.sort, isSorted: q.isSorted, canonicalSearch: q.canonicalSearch, redirectSearch: q.redirectSearch },
    { page: 1, sort: "popular", isSorted: false, canonicalSearch: "", redirectSearch: null },
  );
});

test("?page=2 is canonical as-is and self-describes", () => {
  const q = parseCategoryListingQuery({ page: "2" })!;
  assert.equal(q.page, 2);
  assert.equal(q.canonicalSearch, "?page=2");
  assert.equal(q.redirectSearch, null);
});

test("non-default sorts are valid, noindexed variants canonicalized to the default-sort page", () => {
  for (const sort of ["reviewed", "newest", "alpha"] as const) {
    const p1 = parseCategoryListingQuery({ sort })!;
    assert.deepEqual([p1.sort, p1.isSorted, p1.canonicalSearch, p1.redirectSearch], [sort, true, "", null]);
  }
  const p2 = parseCategoryListingQuery({ sort: "alpha", page: "2" })!;
  assert.equal(p2.canonicalSearch, "?page=2");
  assert.equal(p2.redirectSearch, null);
});

// ── Non-canonical FORM: one-hop normalization ────────────────────────────────

test("?page=1 and leading zeros normalize in one hop", () => {
  assert.equal(parseCategoryListingQuery({ page: "1" })!.redirectSearch, "");
  assert.equal(parseCategoryListingQuery({ page: "01" })!.redirectSearch, "");
  assert.equal(parseCategoryListingQuery({ page: "002" })!.redirectSearch, "?page=2");
});

test("explicit default sort normalizes away, combined forms normalize in ONE redirect", () => {
  assert.equal(parseCategoryListingQuery({ sort: "popular" })!.redirectSearch, "");
  assert.equal(parseCategoryListingQuery({ sort: "popular", page: "2" })!.redirectSearch, "?page=2");
  assert.equal(parseCategoryListingQuery({ sort: "popular", page: "01" })!.redirectSearch, "");
  // Non-default sort survives page normalization.
  assert.equal(parseCategoryListingQuery({ sort: "alpha", page: "02" })!.redirectSearch, "?sort=alpha&page=2");
});

test("unrelated params survive the normalization hop but never enter canonical", () => {
  const q = parseCategoryListingQuery({ utm_source: "partner", page: "01", utm_campaign: "vaar" })!;
  assert.equal(q.redirectSearch, "?utm_source=partner&utm_campaign=vaar");
  assert.equal(q.canonicalSearch, "");
  const q2 = parseCategoryListingQuery({ utm_source: "x", page: "002" })!;
  assert.equal(q2.redirectSearch, "?utm_source=x&page=2");
  assert.equal(q2.canonicalSearch, "?page=2");
  // Unrelated params alone trigger nothing.
  assert.equal(parseCategoryListingQuery({ utm_source: "x" })!.redirectSearch, null);
});

// ── Invalid: hard 404, never page 1 ──────────────────────────────────────────

test("invalid page syntax and values are rejected", () => {
  for (const page of ["", "0", "00", "-1", "+2", "1.5", "2abc", "abc", " 2", "2 ", "1e3", "Infinity", "NaN", "99999999999999999999"]) {
    assert.equal(parseCategoryListingQuery({ page }), null, `page=${JSON.stringify(page)} must 404`);
  }
});

test("unknown and duplicate sorts are rejected; duplicate pages are rejected", () => {
  assert.equal(parseCategoryListingQuery({ sort: "weird" }), null);
  assert.equal(parseCategoryListingQuery({ sort: "" }), null);
  assert.equal(parseCategoryListingQuery({ sort: "POPULAR" }), null);
  assert.equal(parseCategoryListingQuery({ sort: ["alpha", "newest"] }), null);
  assert.equal(parseCategoryListingQuery({ page: ["2", "3"] }), null);
});

test("array-valued unrelated params survive the hop; tracking rides with explicit default sort", () => {
  const q = parseCategoryListingQuery({ tag: ["a", "b"], page: "01" })!;
  assert.equal(q.redirectSearch, "?tag=a&tag=b");
  const q2 = parseCategoryListingQuery({ sort: "popular", utm_source: "mail" })!;
  assert.equal(q2.redirectSearch, "?utm_source=mail");
  assert.equal(q2.canonicalSearch, "");
});

test("safe very deep pages parse exactly", () => {
  const q = parseCategoryListingQuery({ page: "999999999999999" })!;
  assert.equal(q.page, 999999999999999);
  assert.equal(Number.isSafeInteger(q.page), true);
  assert.equal(q.canonicalSearch, "?page=999999999999999");
});

// ── Shared category invariants (PR-6 extractions) ────────────────────────────

test("CATEGORY_PAGE_SIZE is exactly the shipped page size", () => {
  assert.equal(CATEGORY_PAGE_SIZE, 12);
});

test("categoryTargetIds: a leaf category targets only itself", () => {
  assert.deepEqual(categoryTargetIds({ id: "leaf1", children: [] }), ["leaf1"]);
});

test("categoryTargetIds: a parent with children targets the children only", () => {
  assert.deepEqual(
    categoryTargetIds({ id: "top1", children: [{ id: "sub1" }, { id: "sub2" }] }),
    ["sub1", "sub2"],
  );
});

test("categoryTargetIds: the parent id is never silently added beside children", () => {
  const ids = categoryTargetIds({ id: "top1", children: [{ id: "sub1" }] });
  assert.equal(ids.includes("top1"), false);
  assert.deepEqual(ids, ["sub1"]);
});

test("canonicalCategorySearch: bare for page 1, ?page=N for 2+, and the parser agrees", () => {
  assert.equal(canonicalCategorySearch(1), "");
  assert.equal(canonicalCategorySearch(2), "?page=2");
  assert.equal(canonicalCategorySearch(7), "?page=7");
  assert.equal(parseCategoryListingQuery({})!.canonicalSearch, canonicalCategorySearch(1));
  assert.equal(parseCategoryListingQuery({ page: "3" })!.canonicalSearch, canonicalCategorySearch(3));
});
