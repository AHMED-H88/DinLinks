# SEO Standard

## Purpose

This document is the authoritative DinLinks SEO operating standard.

It encodes the accepted, shipped search architecture: URL identity, indexability, localization, pagination, structured data, robots, the sitemap, publishing gates, and the verification that keeps them truthful.

A new contributor must be able to answer every practical SEO question from this file, without access to any earlier conversation or planning document.

Where this standard names a helper, constant, or file, that code is the single implementation of the rule. Do not create a second implementation of any rule defined here.

---

# A. SEO Philosophy

DinLinks SEO exists to make useful, truthful business and discovery pages understandable and discoverable by search engines.

Search engines do not define the product. People do.

SEO must never create:

- fake or inflated inventory;
- thin or duplicated pages;
- misleading metadata;
- fabricated business facts;
- compromised user experience.

Performance matters because fast, reliable pages serve users and support crawlability and search quality. Performance is not claimed as a ranking guarantee.

No ranking, indexing, or traffic outcome is ever guaranteed — not internally, and never to a business.

---

# B. Canonical Origin

The public canonical origin is:

`https://www.dinlinks.com`

Rules:

- Every public canonical URL, Open Graph URL, structured-data URL, and sitemap URL is built from the central site URL helper (`SITE_URL` and the URL helper family in `lib/site.ts`).
- Public canonical URLs must never be derived from authentication configuration (`NEXTAUTH_URL` is an auth setting, not the public origin).
- The unprefixed root `/` performs locale negotiation with a temporary redirect. It is not itself a canonical indexable page, and it never appears in the sitemap.
- Every public page lives under a locale prefix: `/no` (default) or `/en`.

---

# C. Business URL Architecture (D1)

The canonical public business URL is:

`/{locale}/business/{name-derived-slug}-{shortId}`

Identity:

- Identity is the immutable `Business.shortId`: 10 lowercase alphanumeric characters, unique in the database, generated server-side at creation, never settable through any API or form.
- The readable slug is derived from the CURRENT business name at render time. It is presentation only. It is never persisted, and there is no slug history.
- A business whose name yields no slug canonicalizes to the bare shortId form.

Slug derivation (in `lib/site.ts`):

- Norwegian letters fold natively: `æ → ae`, `ø → oe`, `å → aa`.
- Other diacritics reduce to their base letter.
- The result is lowercase ASCII with hyphens, capped at 60 characters.
- Slugification is URL encoding. Business names themselves are never rewritten.

Construction:

- Every business URL — links, canonicals, Open Graph, structured data, sitemap — is generated through the approved helper family in `lib/site.ts` (`businessUrlSegment`, `businessPath`, `localeBusinessPath`, `businessUrl`).
- Hand-building a `/business/` path anywhere is prohibited.

Redirect behavior:

- legacy CUID URL → one permanent redirect to the canonical URL;
- bare shortId compatibility form → one permanent redirect to the canonical URL;
- stale slug with a valid shortId → one permanent redirect to the canonical URL;
- the redirect is always a single hop, and the query string is preserved;
- unknown or non-public business → hard 404.

Demos:

- Outreach demo profiles keep their stable id URLs permanently and never redirect.
- Demos are not part of public discovery or indexing (Section D).

---

# D. Indexability Matrix

## Indexable (when otherwise valid)

- `/no` and `/en` homepages;
- static translated public pages: about, contact, privacy, terms (both locales);
- `/no/categories` and `/en/categories`;
- populated default-sort category pages, both locales;
- canonical default-sort category pagination pages (`?page=N`, page 2+);
- real APPROVED Norwegian business profiles.

Every indexable page carries unique localized metadata and a self-canonical.

## Crawlable but noindex

These surfaces stay reachable and crawlable, and exclude themselves with meta robots (`noindex, follow` under the shipped rules):

- search (`/{locale}/search`, all parameter forms);
- login and signup;
- sorted category variants (`?sort=…`);
- empty category pages (Section F);
- EN real business profiles while D2 remains active (Section E).

A noindexed surface must NOT be robots-blocked merely because it is noindexed. Blocking it would hide the directive from crawlers (Section K).

## Demos

Outreach demo profiles:

- reachable at their stable outreach URLs, both locales;
- `noindex, nofollow`;
- excluded from public discovery (`PUBLIC_DISCOVERY_WHERE`);
- excluded from the sitemap;
- zero LocalBusiness structured data.

## Non-public businesses

PENDING, REJECTED, and unknown businesses are a hard 404 on the public business surface. They have no canonical, no metadata identity, and no sitemap presence.

---

# E. Business Localization Policy (D2)

- The real Norwegian business profile is indexable when the business is publicly eligible.
- The English business profile is `noindex, follow` until meaningful business-level English content exists. The page stays fully usable.
- No business-profile hreflang is emitted in either locale while one side is noindexed.

D2 may be revisited only when the content and localization condition changes — never merely to increase SEO coverage.

---

# F. Empty Categories (D6)

An empty category (zero qualifying inventory under Section G):

- remains accessible at its page-1 URL — a permanent taxonomy URL is never 404ed for emptiness;
- is `noindex, follow`;
- is excluded from the sitemap;
- has no category hreflang pair while non-indexable;
- must never advertise a zero count in its metadata.

The category becomes indexable automatically when qualifying inventory exists under `PUBLIC_DISCOVERY_WHERE` and the exact category-page count semantics. No deploy, no manual step.

Do not hardcode arbitrary density thresholds into D6.

---

# G. Category Population Semantics

`PUBLIC_DISCOVERY_WHERE` (`lib/discovery.ts`) is the single business visibility gate for public discovery:

- status APPROVED;
- non-demo.

Every public discovery surface — category pages, search, counts, the sitemap — filters through it. A second visibility rule is prohibited.

Category target semantics (`categoryTargetIds()` in `lib/category-listing.ts`):

- a category with children targets its child IDs only;
- a leaf category targets its own ID.

Rules:

- The category page and the sitemap must consume this one helper. Divergent cached count sources must not decide indexability or sitemap membership.
- A business attached directly to a parent that has children is not counted by the live category page, and therefore must not change that category's count anywhere else either.

---

# H. Pagination Standard (PR-5)

The default category sort is `popular`.

Canonical form:

- page 1 is the bare category URL;
- page 2+ is `?page=N` in default-sort form;
- each default-sort page is self-canonical — page 2+ is never canonicalized to page 1.

Input handling:

- invalid page or sort syntax (non-digits, zero, signs, decimals, duplicates, unknown sorts) → hard 404, never a silent page 1;
- valid but non-canonical forms (`?page=1`, leading zeros, explicit `?sort=popular`) → one permanent redirect to the canonical form, preserving unrelated parameters;
- out-of-range pages → hard 404, in metadata and rendering alike.

Alternative sorts:

- remain crawlable and fully usable;
- are `noindex, follow`;
- canonicalize to the corresponding default-sort page;
- emit no hreflang and no ItemList.

Structural rules:

- no `rel=next` / `rel=prev` under the current architecture;
- every ordering ends with the immutable unique id tie-breaker, so pagination is deterministic under ties;
- the page size is the shared `CATEGORY_PAGE_SIZE` constant. The category page and the sitemap must use the same constant.

---

# I. hreflang Standard (PR-3)

HTML metadata is the ONE authoritative hreflang system.

Rules:

- Reciprocal pairs use exactly the codes `no` and `en`, built by `localeHreflang()` in `lib/site.ts` as absolute canonical URLs.
- A pair is declared ONLY when both localized pages are indexable translated equivalents: homepages, categories index, static public pages, and populated default-sort category pages (pairing the same page number).
- No `x-default` in the current system.
- No hreflang on: business profiles under D2, empty categories, sorted variants, search, auth, demos, private pages, or 404s.
- `next-intl` automatic alternate Link headers remain disabled (`alternateLinks: false` in `i18n/routing.ts`). Do not re-enable them.
- Do NOT add sitemap hreflang. The sitemap lists plain URLs only (Section L).
- The language switcher renders real crawlable anchors to the equivalent page in the other locale. Those anchors are navigation — they are not a second metadata hreflang system.

---

# J. Structured Data Standard (PR-4)

Structured data may only restate what is true, stored, and visible on the page. Missing means omitted — never guessed, never placeholder-filled.

Serialization:

- Every JSON-LD `dangerouslySetInnerHTML` sink must serialize through `safeJsonLdString()` (`lib/jsonld.ts`).
- Raw `JSON.stringify` into such a sink is prohibited — it is a stored-XSS vector.

## Business pages

Eligible NO real business profiles may emit LocalBusiness JSON-LD, built by the pure builders in `lib/structured-data.ts`, only when the genuinely stored name AND physical street address exist.

Never fabricate:

- address;
- coordinates;
- opening hours;
- ratings or review counts;
- any business fact.

Specific rules:

- Geo coordinates are emitted only when finite and within real ranges: latitude −90..90, longitude −180..180. Invalid values are omitted, never clamped.
- Opening hours reflect stored values exactly. Malformed or missing times omit the day; closed days are represented by omission.
- AggregateRating represents DinLinks' own complete stored review aggregate — the same numbers the visible page shows. Never derive it from a display-capped list, and never aggregate third-party review ratings into it.
- EN business profiles under D2 emit no LocalBusiness schema.
- Demos emit no LocalBusiness schema.

## Category pages

Indexable default-sort category pages may emit page-specific ItemList JSON-LD:

- each pagination page lists only the businesses visible on that page;
- positions reset from 1 on each page;
- the item count equals the marked-up items;
- sorted and noindexed variants emit none; empty categories emit none.

Structured-data eligibility never guarantees a Google rich result. Validation tools confirm eligibility only.

---

# K. robots.txt Standard (PR-6)

`app/robots.ts` emits the robots policy. Current disallows, and nothing more:

- `/api/`
- `/no/dashboard`
- `/en/dashboard`
- `/no/admin`
- `/en/admin`

Public crawling is otherwise generally allowed.

Rules:

- robots.txt is crawl control, not a security boundary. Authentication remains the security boundary for private surfaces.
- Do NOT robots-block a URL merely because it uses meta noindex. A robots-blocked URL can be indexed by reference with its noindex invisible. Keep crawlable: search, auth, EN business profiles, empty categories, sorted variants, and `/_next/` assets.
- The sitemap directive uses the canonical public sitemap URL, built from the central site URL helper — never a separately hardcoded origin.

---

# L. sitemap.xml Standard (PR-6)

`app/sitemap.ts` (queries) and the pure builders in `lib/sitemap-entries.ts` emit the sitemap. It contains canonical, indexable URLs only.

Include:

- both locales of the indexable static public pages (homepage, categories index, about, contact, privacy, terms);
- populated categories in both locales;
- canonical default-sort pagination pages (page 1 bare, `?page=N` for 2+);
- eligible NO real businesses only, in canonical form.

Exclude:

- the unprefixed root `/`;
- search;
- auth;
- demos;
- PENDING and REJECTED businesses;
- EN business profiles under D2;
- empty categories;
- sorted variants;
- dashboard, admin, and API paths;
- legacy, stale, and non-canonical business URL forms;
- `?page=1` and any other non-canonical pagination form;
- out-of-range pages.

The sitemap must consume the shared machinery — never a competing rule:

- `PUBLIC_DISCOVERY_WHERE` (visibility);
- `CATEGORY_PAGE_SIZE` (page count);
- `categoryTargetIds()` (population);
- the canonical category pagination form (`canonicalCategorySearch()`);
- the canonical business URL helpers (`businessUrl()`).

Freshness:

- Current revalidation is 3600 seconds. Sitemap inventory may lag an approved business or category change by up to approximately one hour; the pages themselves and their meta indexability flip live. This lag is accepted.
- Do not add manual sitemap invalidation merely for this in P0.

Fields — the sitemap must NOT emit:

- hreflang alternates;
- `priority`;
- `changeFrequency`;
- `lastModified`.

`Business.updatedAt` must NOT be used for sitemap lastModified: the profile view counter performs incidental Business row updates, so `updatedAt` does not reliably mean public content changed — an ordinary page view would claim a content modification. Absence is better than a misleading timestamp. No substitute (createdAt, review or branch timestamps, build time, approval time, inferred values) is permitted. A dedicated content-modification timestamp may be considered as a separate architecture decision if genuinely needed.

---

# M. Search Console Operating Standard

The Search Console property scope is the Domain property:

`dinlinks.com`

Operational rules:

1. Keep ownership verification intact.
2. Submit the canonical sitemap: `https://www.dinlinks.com/sitemap.xml`.
3. Confirm Search Console can process it.
4. Use URL Inspection for representative canonical URLs.
5. Use Live Test when diagnosing current crawl or index eligibility.
6. Request indexing selectively — not repeatedly, and not for every sitemap URL.
7. Do not interpret reporting delay as a product defect without evidence.
8. Search Console indexing reports can lag actual URL state.
9. Sitemap submission is discovery assistance, not an indexing or ranking guarantee.

This standard records process, not transient metrics. Today's URL counts and dashboard states are snapshots, never architecture.

---

# N. Business Publishing SEO Gate

Before a real business becomes public and indexable, verify:

- it is a real, non-demo business;
- status is APPROVED;
- the canonical shortId architecture is valid for the row;
- the canonical NO URL resolves correctly;
- EN follows D2;
- every fact shown or schema-marked is truthful;
- no fabricated address, hours, geo, or reviews;
- the category assignment follows the Taxonomy Master List;
- public discovery inclusion (`PUBLIC_DISCOVERY_WHERE`) behaves correctly;
- sitemap eligibility follows automatically from the shared gate — no manual step.

Never promise a business indexing, ranking, traffic, or a specific search position.

---

# O. Internal Linking

Internal links support users first.

Use real crawlable anchors where appropriate. Current useful connections:

- categories and subcategories;
- relevant businesses (for example, similar businesses on a profile);
- language equivalents when both sides are valid;
- public business profiles from discovery surfaces.

Do NOT create internal links to imagined SEO landing pages simply to manufacture crawl paths.

---

# P. Deferred SEO Expansion

P0 deliberately does NOT include mass location or city landing pages.

Do not generate:

- city × category combinations;
- location pages;
- keyword doorway pages;
- thin service pages;
- mass programmatic SEO routes

without ALL of:

1. real inventory;
2. clear user value;
3. truthful unique content;
4. an approved architecture decision.

Density first. Landing-page expansion later, only when justified. No generic content farming.

Do not treat `llms.txt`, special AI schema, or similar unapproved mechanisms as ranking shortcuts.

---

# Q. Inventory-Gated Verification

These standing checkpoints run when production first reaches each state. Never fabricate or approve production businesses merely to trigger them.

## First APPROVED real business

Re-verify:

- canonical NO profile returns 200;
- legacy, bare-shortId, and stale-slug forms issue one-hop permanent redirects;
- NO profile is indexable; EN profile is `noindex, follow`;
- the business's category flips to indexable when it qualifies;
- LocalBusiness markup is truthful (name and address present; hours, aggregate, and geo match stored values);
- the business enters the sitemap as its NO canonical URL only.

## First category reaching 13+ publicly discoverable businesses

Re-verify:

- `?page=2` returns 200 and is self-canonical;
- reciprocal same-page NO/EN hreflang;
- page-specific ItemList with positions from 1;
- no duplicate or missing businesses across pages;
- page 2 enters the sitemap.

## First category reaching 25+

Re-verify:

- pages 1/2/3 distribute correctly;
- businesses are unique across pages;
- the last page is correct;
- one-past-last hard 404s;
- ordering is stable across refetches.

---

# R. Measurement

Search success can be monitored using:

- indexed eligible pages;
- impressions, clicks, and CTR;
- organic visits;
- useful business-profile discovery;
- Search Console crawl and index diagnostics.

Do not optimize for ranking positions alone.

Do not treat short-term Search Console volatility as proof of success or failure.

---

# S. Change-Control Rule

Changes to any of the following are product and search architecture changes:

- canonical URL architecture;
- D2;
- D6;
- hreflang;
- robots;
- sitemap eligibility;
- pagination;
- structured data;
- public discovery gates.

They must not be modified casually inside unrelated feature work.

A future change must:

- identify the affected part of this standard;
- inspect current production behavior;
- verify current official search-engine and framework guidance when relevant;
- update the tests that pin the rule;
- update this SEO Standard in the same workstream.

---

# Key Principle

The best SEO comes from building the best business directory — truthful pages, real inventory, and an architecture that never says more to a search engine than it shows to a person.
