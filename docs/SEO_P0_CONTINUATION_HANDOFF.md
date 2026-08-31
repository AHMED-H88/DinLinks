# SEO P0 Continuation Handoff

This is a continuation document for a fresh working session. It records the
FINAL ACCEPTED state of the SEO P0 workstream (SEC-1 and PR-1 through PR-5)
and the starting point for PR-6. It does not replace the DinLinks Playbook or
the approved P0 Specification; where this document is silent, they govern.

Historical reference links (account-private artifacts from the retired
planning session — useful if accessible, NOT a prerequisite for continuing):

- Assessment: "DinLinks Search Readiness" —
  https://claude.ai/code/artifact/f7c71683-1277-4dff-94d1-92067d1b09b0
- P0 Specification: "DinLinks P0 Specification" —
  https://claude.ai/code/artifact/73b18264-318b-4863-ac20-5090fa2d5de6

If those artifacts are not accessible in a fresh session: do NOT reconstruct
them from old chat history and do NOT block PR-6. The Playbook, this handoff,
and the current shipped code contain the accepted continuation constraints
required to specify PR-6. If a decision PR-6 genuinely needs is absent from
those sources, STOP and ask rather than guessing.

---

# 1. Current state

- PR-1 through PR-5 code baseline SHA:
  `f192e6dafcdf1ae986b32032f318b790bfc4c64a` (merge of PR #37) — the exact
  code state this handoff was prepared and cross-checked against. Current
  `main` will move past it (starting with the merge of this document), so a
  fresh session must NOT require `main` to equal it. Instead verify:
  (a) `docs/SEO_P0_CONTINUATION_HANDOFF.md` is present on current `main`;
  (b) the baseline is an ancestor of current `main`
  (`git merge-base --is-ancestor f192e6dafcdf1ae986b32032f318b790bfc4c64a HEAD`);
  (c) any commits after the baseline are inspected — not assumed to be
  errors — and none has altered the accepted PR-1..PR-5 invariants recorded
  here before PR-6 begins.
- Production (Vercel, www.dinlinks.com) was deployed from that baseline and
  verified healthy at handoff creation. Every P0 code PR below is merged and
  was production-verified.
- Production inventory — SNAPSHOT AT HANDOFF CREATION (2026-09-01), re-query
  before relying on it: 4 Business rows — 3 outreach demos (`isDemo = true`,
  `shortId` NULL) and 1 real business in `PENDING` (shortId `cc3e0f0cf6`);
  zero approved real businesses, so at that time no business profile,
  populated category, or pagination page was publicly reachable. The
  inventory-gated checklist (section 7) is valid regardless of how this
  snapshot has since changed.
- The `shortId` schema migration (`20260831120000_add_business_short_id`) is
  applied to the production database.
- Stack facts that matter here: Next.js 14.2.5 App Router, next-intl 4.13.0
  (`localePrefix: "always"`, locales `no` + `en`, default `no`,
  `alternateLinks: false`), Prisma 5.22 CLI / `^5.19` client, tests run via
  `npm test` (Node test runner through `tsx`; 40 passing).
- No robots.txt and no sitemap exist — both 404 in production by design,
  because **PR-6 has NOT started**.
- Google Search Console ownership/configuration status has not been
  independently verified in this workstream. Search Console baseline/setup
  and sitemap submission remain queued after PR-6.

# 2. Completed P0 work — final accepted state

## SEC-1 (security track, merged PR #32)

- `lib/jsonld.ts` — `safeJsonLdString()` is the ONLY legal serializer into a
  JSON-LD `dangerouslySetInnerHTML` sink (escapes every `<` as its JSON
  unicode escape).
  Regression-tested (`tests/jsonld.test.ts`). Raw `JSON.stringify` into a
  sink is a security regression.
- `GET /api/branches` gates its parent business on `PUBLIC_DISCOVERY_WHERE`;
  non-public businessIds return the same 404 as nonexistent ones.

## PR-1 — Business URL Architecture (merged PR #33; approved decision D1)

- Identity = immutable `Business.shortId` (10 chars `[a-z0-9]`, DB-unique,
  generated server-side in `lib/shortid.ts`, never client-settable — not in
  the `pickFields` whitelist). The readable slug is DERIVED from the current
  name at render time and never persisted.
- Canonical form: `/{locale}/business/{slugified-name}-{shortId}`; a
  nameless business canonicalizes to the bare shortId.
- `lib/site.ts` owns the URL shape exclusively:
  `businessUrlSegment` / `businessPath` / `localeBusinessPath` /
  `businessUrl` / `slugifyBusinessName` (æ→ae ø→oe å→aa, NFC-first, 60-char
  cap) / `shortIdFromBusinessRouteParam`. No hand-built `/business/` path may
  exist anywhere.
- Resolution (profile page `resolveBusinessId`, request-cached): shortId
  suffix/bare form first, then exact id (legacy cuids AND demo ids), else
  hard 404. Non-canonical forms (stale slug, bare shortId, legacy cuid) issue
  ONE `permanentRedirect` (308) straight to the canonical URL, preserving the
  query string. Demos NEVER redirect and keep their exact legacy outreach ids.
- View increments / favorites / similar-business queries key on the resolved
  primary id, never the route param, and never count redirect requests.

## PR-2 — Metadata + Canonical + Indexability (merged PR #34; D2, D6)

- Every indexable surface has unique localized metadata and a self-canonical
  (homepage uses `title.absolute` to avoid template doubling). Static-page
  meta strings live in `messages/{no,en}.json` under each page namespace.
- Auth pages: `noindex, follow` via the `(auth)/layout.tsx` route-group
  server layout (the pages are client components). Deliberately NOT
  robots-blocked.
- Search (`/{locale}/search`, all params): `noindex, follow`, bare-search
  self-canonical retained. Deliberately NOT robots-blocked.
- D6 empty categories: the count source is the category page's own targetIds
  aggregation (children-if-any-else-self + `PUBLIC_DISCOVERY_WHERE`) — the
  ONE source that cannot classify a populated top level as empty. Empty ⇒
  `noindex, follow`, count-free meta description (never "0 businesses"),
  empty subcategory chips hidden; URL stays reachable and flips back to
  indexable automatically. Never 404 a permanent taxonomy URL for emptiness.
- D2: real `/no/business/*` indexable; real `/en/business/*`
  `noindex, follow` (usable page, near-duplicate Norwegian content); demos
  `noindex, nofollow` on both locales, taking precedence.
- Pages that define `openGraph` restate `og:locale` and a per-page `og:url`
  matching their canonical (shallow metadata merge drops layout og values).

## PR-3 — Multilingual SEO / hreflang (merged PR #35)

- next-intl automatic alternate `Link` headers are disabled
  (`alternateLinks: false` in `i18n/routing.ts`). HTML metadata is the single
  authoritative hreflang system; do not re-enable the headers.
- `localeHreflang(path)` in `lib/site.ts` builds every pair: absolute
  `SITE_URL` URLs, codes exactly `no` (accepted decision — do not change to
  `nb`) and `en`, self-inclusive, byte-identical from both pair members, no
  `x-default`.
- Pairs exist ONLY where both locales are indexable: homepage, categories
  index, about/contact/privacy/terms, and populated default-sort category
  pages (same page number on both sides). Never on noindexed surfaces.
- `components/LanguageSwitcher.tsx` renders real locale-aware `<Link>`
  anchors (crawlable without JS); plain clicks preserve the live query string
  via the click handler (never `useSearchParams` at render); modified clicks
  fall through to the href.

## PR-4 — Structured Data Correctness (merged PR #36)

- All JSON-LD is assembled by the pure builders in `lib/structured-data.ts`
  (unit-tested) and serialized with `safeJsonLdString` at exactly two sinks
  (business profile, category page). Governing rule: markup only restates
  what is true, stored, and visible — missing means omitted, never guessed.
- LocalBusiness: emitted only on the indexable real NO profile, and only
  when a genuine name AND physical street address exist (builder returns
  null otherwise — no placeholders). EN profiles and demos emit none.
- Opening hours: only stored, valid `HH:MM` pairs on non-closed days;
  malformed/missing ⇒ day omitted; closed days represented by omission.
- One authoritative review aggregate: `prisma.review.aggregate` over the
  COMPLETE review set (every stored review is public; model has no
  moderation state), request-cached, drives metadata rating, all visible
  rating/count surfaces, and AggregateRating identically. The rendered
  review list stays capped at newest 20 (display-only); the reveal control
  says "Vis flere anmeldelser"/"Show more reviews" with the revealed count.
- Geo: emitted only for finite values within latitude −90..90 and longitude
  −180..180 (0 valid; invalid omitted, never clamped).

## PR-5 — Pagination Correctness (merged PR #37)

- `lib/category-listing.ts` — `parseCategoryListingQuery` is the ONLY parser
  for the category page's `page`/`sort`; `generateMetadata` and the renderer
  share it. Sorts are exactly `popular|reviewed|newest|alpha` (default
  `popular`, case-sensitive).
- Invalid page/sort syntax, `0`, signs, decimals, garbage, unsafe integers,
  and duplicate (array) params ⇒ hard 404, never a silent page 1.
- Valid non-canonical FORM (`?page=1`, leading zeros, explicit
  `?sort=popular`) ⇒ ONE 308 to the canonical form; unrelated (tracking)
  params survive the hop but never enter canonical/hreflang URLs.
- Canonical: page 1 = bare URL; page 2+ = `?page=N`, always default-sort
  form. Out-of-range pages hard-404 (metadata collapses on the same rule),
  and the qualifying count runs BEFORE the slice query so no unvalidated
  value ever reaches Prisma `skip` — this ordering is load-bearing.
- Alternative sorts remain fully usable but are `noindex, follow`,
  canonicalize to the equivalent default-sort page, and emit no hreflang and
  no ItemList.
- Every ordering ends with the immutable unique `id` tie-breaker
  (deterministic pagination under ties).
- ItemList is page-scoped: only the businesses rendered on that URL,
  `numberOfItems` = marked-up items, positions 1..n per page.
- No `rel=next/prev`. Pagination links emit only canonical forms.

# 3. Authoritative indexation matrix

| Surface | Robots | Canonical | hreflang | Sitemap (PR-6) |
|---|---|---|---|---|
| NO homepage + about/contact/privacy/terms | index, follow | self | NO↔EN pair | include |
| EN homepage + static pages | index, follow | self | NO↔EN pair | include |
| Categories index (both locales) | index, follow | self | NO↔EN pair | include |
| Populated category, page 1 | index, follow | bare category URL | NO↔EN base pair | include |
| Populated category, page 2+ | index, follow | self `?page=N` | NO↔EN same-page pair | include |
| Empty category (base URL) | noindex, follow | self | none | exclude |
| Sorted category variants (`?sort=…`) | noindex, follow | equivalent default-sort page | none | exclude |
| Real NO business profile | index, follow | self (slug-shortId) | none (D2) | include (NO URL only) |
| Real EN business profile | noindex, follow | self | none | exclude |
| Demo profiles (both locales) | noindex, nofollow | self (legacy id) | none | exclude |
| Search (bare + all params) | noindex, follow | bare `/{locale}/search` | none | exclude |
| Login / signup | noindex, follow | none needed | none | exclude |
| Invalid / out-of-range category URLs | hard 404 | none | none | n/a |
| Unknown / unpublished business URLs | hard 404 | none | none | n/a |
| Dashboard / admin | 307 to login (auth boundary) | — | — | exclude |

# 4. Final URL architecture

Business URLs:

- name-derived slug + immutable 10-character shortId; shortId owns identity,
  the CURRENT name owns the presentation slug (nothing persisted);
- stale slug → one-hop 308 to canonical;
- bare shortId → one-hop 308 to canonical;
- legacy CUID → one-hop 308 to canonical (never CUID→shortId→canonical);
- demos retain their exact legacy outreach ids and never redirect;
- unknown/unpublished → hard 404.

Category pagination:

- page 1 = bare category URL; page 2+ = `?page=N`;
- each default-sort page self-canonical;
- `?page=1`, leading zeros, and explicit `?sort=popular` normalize with one
  permanent redirect (tracking params preserved);
- invalid page/sort → hard 404; beyond-last page → hard 404;
- alternative sorts stay usable but noindex and canonicalize to the
  equivalent default-sort page.

# 5. Structured-data rules

LocalBusiness (`lib/structured-data.ts`, profile page):

- only the indexable real NO business; requires truthful name + physical
  address; EN emits none; demos emit none;
- no fabricated hours — incomplete/malformed hours omitted; closed days
  omitted;
- the complete-set review aggregate is the only aggregate source;
- geo only when finite AND within real geographic ranges;
- `safeJsonLdString` at the sink, always.

Category ItemList:

- only indexable default-sort category pages;
- each pagination page describes only the businesses visible on that page;
- positions start at 1 on every page; `numberOfItems` = marked-up items;
- sorted variants emit none; empty categories emit none.

# 6. Multilingual rules

- Languages are NO and EN only; hreflang codes are exactly `no` and `en`.
- next-intl automatic alternate Link headers are disabled; HTML metadata is
  the authoritative hreflang system.
- Indexable translated public surfaces carry reciprocal NO/EN hreflang;
  populated default-sort pagination pairs the same page number.
- No hreflang on: empty categories, sorted variants, any business profile
  (while EN businesses remain noindexed), demos, search, auth, 404s.
- No `x-default`.
- LanguageSwitcher renders real crawlable links to the same route in the
  other locale.

# 7. Inventory-gated production verification

One consolidated checklist. Run each block when production first reaches the
stated inventory. Never fabricate or approve businesses to test.

## First APPROVED real business

- PR-1: canonical slug-shortId URL 200; legacy CUID → one-hop 308; bare
  shortId → one-hop 308; stale slug → one-hop 308; query string preserved
  through the redirect.
- PR-2: NO profile `index, follow`; EN profile `noindex, follow`; the
  business's category flips to indexable (and its chip appears) when it
  qualifies.
- PR-3: no business-profile hreflang in either locale.
- PR-4: truthful LocalBusiness JSON-LD on the eligible NO profile (name +
  address present); zero LocalBusiness on EN; opening hours match stored
  values exactly (no invented times); AggregateRating value/count match the
  visible complete aggregate; geo present only when valid; run Google Rich
  Results Test as validation only — never claim Google will show a rich
  result.

## First category reaching 13+ APPROVED PUBLIC_DISCOVERY businesses

- `?page=2` returns 200; self-canonical includes `?page=2`;
- reciprocal NO/EN hreflang uses page 2 on both sides;
- page-specific ItemList (only that page's businesses, positions from 1);
- no duplicate/missing businesses across pages 1–2.

## First category reaching 25+

- pages 1/2/3 render 12+12+remainder with unique businesses across all
  pages; last page correct; one-past-last hard 404s; ordering stable across
  refetches.

# 8. PR-6 starting point — ROBOTS.TXT + SITEMAP.XML

**PR-6 has NOT started.** It must now be specified and implemented from the
accepted PR-1..PR-5 behavior recorded above, inspecting the current code
first — do not invent the final implementation from this document alone.

Known accepted direction:

robots (`app/robots.ts`):

- never robots-block a page that relies on meta noindex — search and auth
  MUST remain crawlable so Google can read the directive;
- private surfaces (dashboard, admin, `/api/`) are the disallow candidates
  (auth remains the real security boundary);
- root locale negotiation (`/` → 307) remains unchanged;
- the middleware matcher already exempts dotted paths, so `/robots.txt` and
  `/sitemap.xml` bypass locale handling with no middleware changes.

sitemap (`app/sitemap.ts`):

- canonical URLs only; indexable surfaces only (section 3's include column);
- businesses: APPROVED real businesses via `PUBLIC_DISCOVERY_WHERE` (demos
  excluded by construction), NO URLs only (D2), canonical slug-shortId form
  via `businessUrl()` — never hand-built;
- categories: only pages with qualifying inventory, using the SAME targetIds
  count semantics as the page (never the divergent count sources in
  `lib/cached-data.ts`); pagination entries only in canonical default-sort
  form (page 1 bare, `?page=N` for 2+) — `lib/category-listing.ts`'s
  `canonicalSearch` is the ready-made source of truth;
- exclude: search, auth, EN business profiles, empty categories, sorted
  variants, demos, dashboard/admin/API, legacy/non-canonical URL forms.

# 9. PR-6 non-negotiable preservation rules

PR-6 must not reopen or alter:

- business URL architecture (shortId identity, derived slug, 308 behavior);
- D2 EN business noindex;
- D6 empty-category behavior;
- pagination canonical policy;
- hreflang policy (including `no`/`en` codes, no x-default);
- structured-data policy;
- taxonomy;
- demo isolation (URLs, noindex/nofollow, zero JSON-LD, discovery exclusion);
- `PUBLIC_DISCOVERY_WHERE` as the single public-visibility gate;
- root locale 307;
- `safeJsonLdString` serialization.

# 10. Remaining sequence after PR-6

1. Production verification of robots/sitemap behavior.
2. Google Search Console property verification + baseline snapshot.
3. Sitemap submission.
4. Representative URL Inspection checks.
5. PR-7: rewrite `docs/08_SEO_STANDARD.md` to encode the accepted, shipped
   system (Playbook process; approved decision D7).
6. Stop expanding technical P0 SEO and shift the primary focus back to
   real-business acquisition. Inventory/content density is the next
   practical constraint on DinLinks' search usefulness and growth — not the
   only ranking factor, and nothing here promises rankings.

# 11. Fresh-session startup instructions

Reading order for the fresh session, in order:

1. `docs/00_PLAYBOOK_INDEX.md`
2. The Playbook documents that index requires for SEO/development work — at
   minimum: Constitution, Development Rules, SEO Standard, Localization
   Standard, Verification Standard, and
   `docs/specifications/03_TAXONOMY_MASTER_LIST.md`.
3. The approved DinLinks P0 Specification IF the artifact link at the top of
   this document is accessible; if it is not, skip it — do not reconstruct
   it and do not block on it (this handoff + Playbook + shipped code carry
   the constraints PR-6 needs).
4. `docs/SEO_P0_CONTINUATION_HANDOFF.md` (this document).
5. The current implementations relevant to PR-6, before proposing anything:
   `middleware.ts`, `i18n/routing.ts`, `lib/site.ts`, `lib/discovery.ts`,
   `lib/category-listing.ts`, `lib/structured-data.ts`,
   `app/[locale]/categories/[slug]/page.tsx`,
   `app/[locale]/business/[id]/page.tsx`, and `prisma/schema.prisma`.

The fresh session must inspect current code before proposing changes, treat
this handoff as the accepted SEO continuation state, and must not
reconstruct superseded decisions from old chat history.
