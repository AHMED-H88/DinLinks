import { test } from "node:test";
import assert from "node:assert/strict";
import { SITE_URL } from "../lib/site";
import robots from "../app/robots";

const result = robots();
const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
const disallow = rules.flatMap((r) => {
  const d = r?.disallow;
  return d === undefined ? [] : Array.isArray(d) ? d : [d];
});

test("exactly one wildcard rule group", () => {
  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.userAgent, "*");
});

test("disallow is exactly the approved private/API prefix set, in order", () => {
  assert.deepEqual(disallow, [
    "/api/",
    "/no/dashboard",
    "/en/dashboard",
    "/no/admin",
    "/en/admin",
  ]);
});

test("no noindex-dependent surface is robots-blocked", () => {
  // These rely on a crawlable meta noindex (or are indexable) — a disallow
  // here would hide the directive from Google. Prefix semantics: assert no
  // disallow entry is a prefix of any of these paths.
  const mustStayCrawlable = [
    "/no/search",
    "/en/search",
    "/no/login",
    "/en/login",
    "/no/signup",
    "/en/signup",
    "/en/business/some-name-a1b2c3d4e5",
    "/no/categories/mat",
    "/no/categories/mat?sort=newest",
    "/_next/static/chunk.js",
  ];
  for (const path of mustStayCrawlable) {
    for (const rule of disallow) {
      assert.equal(path.startsWith(rule), false, `${rule} would block ${path}`);
    }
  }
});

test("the disallow prefixes cover the route roots and their descendants", () => {
  for (const covered of [
    "/api/branches",
    "/no/dashboard",
    "/no/dashboard/account/billing",
    "/en/dashboard",
    "/no/admin",
    "/no/admin/categories",
    "/en/admin",
  ]) {
    assert.equal(
      disallow.some((rule) => covered.startsWith(rule)),
      true,
      `nothing covers ${covered}`,
    );
  }
});

test("no explicit allow list — public crawling is generally allowed by default", () => {
  assert.equal(rules[0]?.allow, undefined);
});

test("sitemap line is SITE_URL-derived", () => {
  assert.equal(result.sitemap, `${SITE_URL}/sitemap.xml`);
});
