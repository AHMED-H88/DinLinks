import { test } from "node:test";
import assert from "node:assert/strict";
import { SITE_URL, businessUrl } from "../lib/site";
import {
  STATIC_PATHS,
  buildStaticEntries,
  buildCategoryEntries,
  buildBusinessEntries,
  countByCategory,
  deriveCategoryCounts,
} from "../lib/sitemap-entries";

const LOCALES = ["en", "no"] as const;

function urls(entries: { url: string }[]): string[] {
  return entries.map((e) => e.url);
}

// ── Static entries ───────────────────────────────────────────────────────────

test("static entries: both locales of every indexable static surface, no unprefixed root", () => {
  const entries = buildStaticEntries(LOCALES);
  const u = urls(entries);
  for (const path of ["", "/categories", "/about", "/contact", "/privacy", "/terms"]) {
    assert.equal(u.includes(`${SITE_URL}/no${path}`), true, `missing /no${path}`);
    assert.equal(u.includes(`${SITE_URL}/en${path}`), true, `missing /en${path}`);
  }
  assert.equal(entries.length, STATIC_PATHS.length * LOCALES.length);
  assert.equal(u.includes(SITE_URL), false);
  assert.equal(u.includes(`${SITE_URL}/`), false);
});

// ── Category counts: the page's targetIds semantics, from one dataset ────────

test("countByCategory groups the public dataset; null categoryIds count nowhere", () => {
  const counts = countByCategory([
    { categoryId: "sub1" },
    { categoryId: "sub1" },
    { categoryId: "sub2" },
    { categoryId: null },
  ]);
  assert.equal(counts.get("sub1"), 2);
  assert.equal(counts.get("sub2"), 1);
  assert.equal(counts.size, 2);
});

test("a leaf counts itself; a parent with children counts children only", () => {
  const counts = countByCategory([
    { categoryId: "sub1" },
    { categoryId: "sub1" },
    { categoryId: "leaf" },
    // Attached directly to a parent that HAS children — the category page
    // does not count it, so the sitemap must not either.
    { categoryId: "top" },
  ]);
  const derived = deriveCategoryCounts(
    [
      { id: "top", slug: "tjenester", children: [{ id: "sub1" }, { id: "sub2" }] },
      { id: "leaf", slug: "frisor", children: [] },
    ],
    counts,
  );
  assert.deepEqual(derived, [
    { slug: "tjenester", count: 2 },
    { slug: "frisor", count: 1 },
  ]);
});

// ── Category entries: canonical pagination expansion ─────────────────────────

function categoryUrls(count: number): string[] {
  return urls(buildCategoryEntries([{ slug: "mat", count }], ["no"]));
}

test("count 0 emits no category entries at all (D6 exclusion)", () => {
  assert.deepEqual(categoryUrls(0), []);
});

test("counts 1 and 12 emit page 1 only, as the bare URL", () => {
  assert.deepEqual(categoryUrls(1), [`${SITE_URL}/no/categories/mat`]);
  assert.deepEqual(categoryUrls(12), [`${SITE_URL}/no/categories/mat`]);
});

test("count 13 emits pages 1-2; count 24 emits pages 1-2; count 25 emits pages 1-3", () => {
  assert.deepEqual(categoryUrls(13), [
    `${SITE_URL}/no/categories/mat`,
    `${SITE_URL}/no/categories/mat?page=2`,
  ]);
  assert.deepEqual(categoryUrls(24), [
    `${SITE_URL}/no/categories/mat`,
    `${SITE_URL}/no/categories/mat?page=2`,
  ]);
  assert.deepEqual(categoryUrls(25), [
    `${SITE_URL}/no/categories/mat`,
    `${SITE_URL}/no/categories/mat?page=2`,
    `${SITE_URL}/no/categories/mat?page=3`,
  ]);
});

test("no entry ever carries ?page=1, a sort, or any other parameter", () => {
  const u = urls(buildCategoryEntries([{ slug: "mat", count: 40 }], [...LOCALES]));
  for (const url of u) {
    assert.equal(url.includes("page=1&") || url.endsWith("page=1"), false, url);
    assert.equal(url.includes("sort="), false, url);
    const query = url.split("?")[1];
    if (query) assert.match(query, /^page=\d+$/);
  }
});

test("both locales get the same page set", () => {
  const u = urls(buildCategoryEntries([{ slug: "mat", count: 13 }], [...LOCALES]));
  assert.deepEqual(u.sort(), [
    `${SITE_URL}/en/categories/mat`,
    `${SITE_URL}/en/categories/mat?page=2`,
    `${SITE_URL}/no/categories/mat`,
    `${SITE_URL}/no/categories/mat?page=2`,
  ]);
});

// ── Business entries ─────────────────────────────────────────────────────────

const businessRow = {
  id: "cmf0000000000000000000001",
  name: "Bakst & Bønner",
  shortId: "a1b2c3d4e5",
  isDemo: false,
};

test("an eligible business gets exactly its NO canonical businessUrl(), nothing hand-built", () => {
  const entries = buildBusinessEntries([businessRow]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].url, businessUrl("no", businessRow));
  assert.equal(entries[0].url, `${SITE_URL}/no/business/bakst-boenner-a1b2c3d4e5`);
});

test("no EN business URL is ever emitted (D2)", () => {
  for (const e of buildBusinessEntries([businessRow])) {
    assert.equal(e.url.includes("/en/"), false);
    assert.equal(e.url.startsWith(`${SITE_URL}/no/business/`), true);
  }
});

test("a NULL-shortId row advertises its id URL — that row's actual canonical", () => {
  const [entry] = buildBusinessEntries([{ ...businessRow, shortId: null }]);
  assert.equal(entry.url, `${SITE_URL}/no/business/${businessRow.id}`);
});

// ── No guessed metadata, no second hreflang system ───────────────────────────

test("no entry carries alternates, changeFrequency, or priority", () => {
  const all = [
    ...buildStaticEntries([...LOCALES]),
    ...buildCategoryEntries([{ slug: "mat", count: 25 }], [...LOCALES]),
    ...buildBusinessEntries([businessRow]),
  ];
  for (const entry of all) {
    assert.equal("alternates" in entry, false);
    assert.equal("changeFrequency" in entry, false);
    assert.equal("priority" in entry, false);
  }
});

test("no entry carries lastModified — business, static, or category", () => {
  // Regression for the PR #39 review finding: Business.updatedAt is
  // @updatedAt and the profile page's view counter bumps it on ordinary
  // visits, so it must never feed a sitemap lastModified. Until a field
  // exists that means "public profile content changed", the ENTIRE sitemap
  // emits zero lastModified.
  for (const e of buildBusinessEntries([businessRow, { ...businessRow, id: "z2", shortId: "zzzzzzzzz9" }]))
    assert.equal("lastModified" in e, false);
  for (const e of buildStaticEntries([...LOCALES])) assert.equal("lastModified" in e, false);
  for (const e of buildCategoryEntries([{ slug: "mat", count: 25 }], [...LOCALES]))
    assert.equal("lastModified" in e, false);
});

// ── Determinism and uniqueness ───────────────────────────────────────────────

test("identical inputs produce identical output, in the same order", () => {
  const build = () =>
    urls([
      ...buildStaticEntries([...LOCALES]),
      ...buildCategoryEntries(
        [
          { slug: "mat", count: 13 },
          { slug: "tjenester", count: 1 },
        ],
        [...LOCALES],
      ),
      ...buildBusinessEntries([businessRow, { ...businessRow, id: "z", shortId: "zzzzzzzzz9", name: "Ås" }]),
    ]);
  assert.deepEqual(build(), build());
});

test("the assembled sitemap contains no duplicate URLs", () => {
  const all = urls([
    ...buildStaticEntries([...LOCALES]),
    ...buildCategoryEntries(
      [
        { slug: "mat", count: 25 },
        { slug: "frisor", count: 3 },
      ],
      [...LOCALES],
    ),
    ...buildBusinessEntries([businessRow]),
  ]);
  assert.equal(new Set(all).size, all.length);
});
