# DinLinks i18n Architecture Review

> Version 1.0 · Recommendations only — no refactoring performed or proposed for immediate action.

## Current implementation (verified)

- **Library:** next-intl v4 with App Router, `app/[locale]/` segment routing, `@/i18n/routing` navigation wrappers (`useRouter` from routing module is correctly used in client components).
- **Message files:** `messages/en.json` + `messages/no.json`, 574 keys each, **verified perfect key parity** (scripted check: zero missing keys either direction).
- **Server pattern:** `getTranslations({ locale, namespace })` in pages with locale params; request-scoped `getTranslations(namespace)` in server components without locale props (SearchResults) — both are correct next-intl patterns.
- **Client pattern:** `useTranslations(namespace)` via `NextIntlClientProvider` configured in `app/[locale]/layout.tsx`.
- **Locale formatting:** `nb-NO` / `en-GB` passed to `toLocaleDateString`/`toLocaleString` — correct approach, keep dates out of JSON.

## Findings

### 1. Missing translation keys
**None.** Parity is perfect. Risk instead runs the other direction: ~24 namespaces exist in JSON but are not yet referenced by any component (prepared for the migration groups). Not a defect — but until wiring completes, dead keys can silently drift out of date. Mitigation: finish the migration groups; then run a key-usage check.

### 2. Duplicated keys
No duplicate key *paths* (JSON would not parse). Duplicate *values* by design in three places: "No reviews yet" (×3 namespaces), day names (×2), sort labels (×2). Recommendation: tolerate for now; if a fourth duplicate appears, introduce a `common` namespace in its own migration group. Do not restructure mid-migration.

### 3. Namespace consistency
Naming is mostly per-component (`searchFilters`, `businessTable`) with a few per-page (`dashboard`, `about`) and one per-feature (`auth.login`/`auth.signup`). This tri-style split is acceptable and self-documenting; codify it: **pages get page namespaces, shared components get component namespaces, multi-page features get feature namespaces.** Avoid creating any new top-level namespace without checking `terminology.md` and this rule.

### 4. Hardcoded UI strings
~365 remaining across 27 files — fully cataloged with priorities in `language-audit.md`. All required keys already exist in both JSON files, so remaining work is wiring only (imports + `t()` calls), no key authoring.

### 5. Untranslated components
Fully wired: Header, Footer, FavoriteButton, SearchBar, SearchFilters, SearchResults, search page, ReviewForm, ReviewList, BranchesSection, ProfileGallery, business profile page (3 leftovers noted in audit).
Not wired: 22 files — see audit sections A and the group plan.

## Recommendations (in order)

1. **Complete the group-by-group wiring** per the plan in `language-audit.md` before any structural i18n changes.
2. **Fix the three business-page leftovers** (audit items 7–9) in the same group as nav polish — they are regressions from the earlier regex migration and contradict "Phase 2 complete".
3. **After wiring completes,** add a CI-style guard script (`node scripts/check-i18n.mjs`): (a) key parity between locales, (b) grep for `isNo ?` ternaries, (c) optionally flag JSX string literals. The parity check from this audit can be reused as-is.
4. **Do not adopt** per-component message splitting, ICU plural rules, or a translation-management platform at this stage — 574 keys × 2 locales is comfortably maintainable as two files, and premature structure would slow the freeze-period cleanup.
5. **Consider later** (post-freeze): typed keys via next-intl's TypeScript augmentation to make missing keys a compile error instead of a runtime one.
