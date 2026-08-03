# DinLinks Language Audit

> Version 1.0 · Audit date: July 2026 · Branch: `feature/business-profile-v2`
> Scope: all user-facing text in `app/` and `components/`. Analysis only — no files were changed by this audit.

## Method

- Full read of all 39 `.tsx` files in `app/` and `components/`
- Pattern scans for `TODO`, `FIXME`, lorem ipsum, test text, `isNo` ternaries, spelling variants
- Key-parity check of `messages/en.json` vs `messages/no.json` (574 keys each, zero missing on either side)

## Headline numbers

| Metric | Count |
|---|---|
| Hardcoded user-visible string instances found | **~400** |
| Already fixed in committed i18n groups (profile cluster, FavoriteButton, search cluster) | ~35 |
| **Remaining to fix** | **~365 across 27 files** |
| Pages 100 % wrong-language for one locale | 8 (about, contact, privacy, terms, home hero/features, categories ×2, admin) |
| Mixed-language pages (both languages hardcoded together) | 4 (dashboard, login, signup, BranchManager) |
| Terminology inconsistencies | 9 |
| TODO / lorem ipsum / test text | 0 (clean) |

Severity definitions — **High**: public page, wrong language guaranteed for one locale. **Medium**: signed-in owner-facing, or partial mixing. **Low**: admin-internal or cosmetic inconsistency.

---

## A. Hardcoded strings by file

### Public pages

| File | Current text (examples) | Problem | Recommended replacement | Priority |
|---|---|---|---|---|
| `app/[locale]/about/page.tsx` | «Om DinLinks», «Vår visjon», 17 strings | Norwegian-only; `/en/about` renders Norwegian | `about.*` namespace (keys already exist in both JSON files) | **High** |
| `app/[locale]/contact/page.tsx` | «Kontakt oss», form labels, 4 FAQ pairs, 25 strings | Norwegian-only | `contact.*` namespace (keys exist) | **High** |
| `app/[locale]/privacy/page.tsx` | «Personvernerklæring», 24 strings | Norwegian-only; legal text unreadable for English users | `privacy.*` namespace (keys exist) | **High** |
| `app/[locale]/terms/page.tsx` | «Vilkår og betingelser», 27 strings | Norwegian-only | `terms.*` namespace (keys exist) | **High** |
| `app/[locale]/page.tsx` (home) | "Find trusted local businesses", "Why DinLinks", feature cards, owner benefits — ~25 strings | English-only sections; `/no` home is mixed | `home.*` extension keys (exist: `heroTitle`, `feature1Title`…) | **High** |
| `app/[locale]/layout.tsx` | "DinLinks — Norway's Business Directory" + 4 more meta strings | English-only metadata; Norwegian users get English SEO/social previews | `layout.*` namespace (keys exist) | **High** |
| `app/[locale]/categories/page.tsx` | "Browse", "All categories", "verified businesses" | English-only | `categoriesPage.*` (keys exist) | **High** |
| `app/[locale]/categories/[slug]/page.tsx` | "Home", "Categories", "No X businesses yet", "Be the first to list…", ~10 strings | English-only, incl. breadcrumbs | `categoryPage.*` (keys exist; `noBusinesses`/`beFirst` take `{category}` param) | **High** |
| `app/[locale]/(auth)/login/page.tsx` | «Velkommen tilbake» + "Invalid email or password" | **Mixed**: Norwegian UI, English errors — both locales see wrong-language text | `auth.login.*` (keys exist) | **High** |
| `app/[locale]/(auth)/signup/page.tsx` | «Opprett konto», Norwegian-only incl. validation errors | English users cannot read signup | `auth.signup.*` (keys exist) | **High** |
| `app/[locale]/business/[id]/page.tsx` | `isNo ? "filial" : "branch"` (line 322); `generateMetadata` title/description ternaries (lines 64–72); "Business not found | DinLinks" (line 60) | Leftovers the Phase 2 regex migration missed — template-literal patterns didn't match | `t("hero.branchSingular"/"branchPlural")`, `t("meta.*")` incl. `notFound` | **High** |

### Signed-in pages

| File | Current text (examples) | Problem | Recommended replacement | Priority |
|---|---|---|---|---|
| `app/[locale]/dashboard/page.tsx` | `isNo ? "Profilvisninger" : "Profile views"` ×4, "Welcome back,", "Getting started", 5 steps, status badges — 27 strings | Mixed ternaries + English-only sections | `dashboard.*` (keys exist) | **Medium** |
| `components/BusinessForm.tsx` | ~60 strings: tab names, labels, placeholders, hints, status banners | English-only; Norwegian owners manage their profile in English | `businessForm.*` (keys exist, structured: tabs/labels/placeholders/hints/actions/status) | **Medium** |
| `components/BranchManager.tsx` | ~40 `isNo ? … : …` ternaries duplicating text that already exists in the `branches` namespace | Duplication + mixing; `branches.*` keys are already loaded and unused here | Replace ternaries with `useTranslations("branches")` | **Medium** |
| `components/SubscriptionCard.tsx` | "Subscription", "Monthly Plan", "$29/month", 17 strings | English-only. **Also flags a product question: USD pricing on a Norwegian platform** | `subscriptionCard.*` (keys exist). Pricing currency needs a product decision — out of i18n scope | **Medium** |
| `components/DashboardNav.tsx` | "Sign Out" | English-only + title case | `nav.signOut` (exists) | **Medium** |

### Shared components

| File | Current text | Problem | Recommended replacement | Priority |
|---|---|---|---|---|
| `components/BusinessCard.tsx` | "Verified", "No reviews yet" | English-only; appears on home, search, categories | `businessCard.*` (keys exist) | **High** |
| `components/CategoriesClient.tsx` | "Search categories…", "No categories found", 6 strings | English-only | `categoriesClient.*` (keys exist) | **High** |
| `components/CategoryList.tsx` | "businesses" count suffix | English-only | `categoryList.businessPlural` (exists) | **High** |
| `components/CategorySortBar.tsx` | "Most popular", "Sort by", 5 strings | English-only; duplicates SearchFilters wording | `categorySortBar.*` (keys exist) | **High** |
| `components/Header.tsx` | "EN"/"NO", "DinLinks", "DL" | **Not issues** — locale codes and brand marks are correctly untranslated | none | — |

### Admin

| File | Current text | Problem | Recommended replacement | Priority |
|---|---|---|---|---|
| `app/[locale]/admin/page.tsx` | "Business management", stat labels — 6 strings | English-only (internal tool; Norwegian admins likely tolerate) | `admin.*` (keys exist) | **Low** |
| `app/[locale]/admin/categories/page.tsx` | "Categories", "Create and manage…" | English-only | `admin.categories.*` (exists) | **Low** |
| `components/AdminNav.tsx` | "Businesses", "Categories", "Sign out" | English-only | `adminNav.*` (exists) | **Low** |
| `components/BusinessTable.tsx` | ~55 strings: columns, status badges, delete dialog, empty states | English-only. ⚠ Contains `"Approved"` etc. as **display text near status-enum logic** (`status === "APPROVED"`); replacement must be surgical, display strings only | `businessTable.*` (exists) | **Low** |
| `components/CategoryManager.tsx` | "Add New Category" (title case!), `confirm()` dialog, 8 strings | English-only + capitalization violation | `categoryManager.*` (exists) | **Low** |

---

## B. Terminology & consistency issues

| # | Issue | Where | Recommendation | Priority |
|---|---|---|---|---|
| 1 | "Favourites" vs "Favorites" | `dashboard/page.tsx`, `BusinessTable.tsx` vs JSON keys | Standardize display on British "favourites" (en-GB convention) | Medium |
| 2 | "Sign In"/"Sign Out"/"Register Business" title case | `nav.*` keys in `en.json` | Sentence case: "Sign in", "Sign out", "Register business" | Medium |
| 3 | `nav.language` = "Lang" | `en.json` | "Language" (no abbreviation; Norwegian already says «Språk») | Medium |
| 4 | "No reviews yet" exists as 3 separate keys | `branches.noReviews`, `businessCard.noReviews`, `profile.reviews.noReviews` | Acceptable per-namespace duplication, but values must stay identical — add note in JSON or consolidate to a `common` namespace later | Low |
| 5 | Day names duplicated | `businessForm.days.*` and `profile.days.*` | Same as above — keep in sync or consolidate to `common.days` | Low |
| 6 | Sort labels duplicated | `searchFilters.*` and `categorySortBar.*` | Keep values identical; candidates for `common.sort` | Low |
| 7 | "Add New Category" capitalization | `CategoryManager.tsx` | «Legg til ny kategori» / "Add new category" | Low |
| 8 | `A → Z` sort label | SearchFilters/CategorySortBar | Norwegian must be «A → Å» (already correct in `no.json`) — verify after wiring | Low |
| 9 | Dashes/ellipses mixed (`…` vs `...`) | various | Standardize on `…` character per brand guide | Low |

## C. Placeholder / test / stale text

- **No TODO, FIXME, lorem ipsum, or test strings found** in `app/`, `components/`, `lib/`.
- `contact/page.tsx` lists `support@dinlinks.no`, `privacy@dinlinks.no`, and office hours — **verify these are real** before launch; they read as plausible placeholders.
- Home page stats "10 000+", "8 000+", "50 000+" are hardcoded marketing numbers — verify they are true, or make them dynamic. Untrue numbers conflict with the trust-first brand.

---

## Top 20 highest-priority issues

1. `privacy/page.tsx` — legal text Norwegian-only (compliance risk for English users)
2. `terms/page.tsx` — legal text Norwegian-only (same)
3. `login/page.tsx` — English error messages inside Norwegian UI (both locales broken)
4. `signup/page.tsx` — Norwegian-only including validation errors
5. `layout.tsx` — English-only site metadata for Norwegian locale (SEO + social)
6. `page.tsx` (home) — hero, features, owner-benefits English-only on `/no`
7. `business/[id]/page.tsx:64-72` — `generateMetadata` isNo ternary leftovers
8. `business/[id]/page.tsx:322` — branch-count ternary leftover
9. `business/[id]/page.tsx:60` — "Business not found | DinLinks" hardcoded
10. `BusinessCard.tsx` — "Verified"/"No reviews yet" English-only on every listing surface
11. `categories/[slug]/page.tsx` — breadcrumbs + empty state English-only
12. `categories/page.tsx` — heading strings English-only
13. `CategoriesClient.tsx` — search + empty states English-only
14. `CategorySortBar.tsx` — sort labels English-only
15. `about/page.tsx` — Norwegian-only
16. `contact/page.tsx` — Norwegian-only + unverified contact details
17. `dashboard/page.tsx` — mixed ternaries + English sections
18. `BranchManager.tsx` — 40 ternaries duplicating existing `branches` keys
19. `BusinessForm.tsx` — 60 English-only strings for Norwegian business owners
20. `nav.*` title-case + "Lang" abbreviation in `en.json`

---

## Recommended execution plan (small, safe phases)

Continue the proven group workflow: read files fully → surgical edits → build + `tsc` → commit → review gate.

| Group | Files | Size | Priority |
|---|---|---|---|
| 2. Categories cluster | CategoriesClient, CategoryList, CategorySortBar, categories/page, categories/[slug]/page | 5 files | High |
| 3. Home + metadata | app/[locale]/page.tsx, app/[locale]/layout.tsx, BusinessCard | 3 files | High |
| 4. Auth cluster | login/page, signup/page | 2 files | High |
| 5. Profile-page leftovers + nav polish | business/[id]/page.tsx (3 leftovers), en.json nav fixes, DashboardNav | 3 files | High |
| 6. Static pages | about, contact, privacy, terms | 4 files | High |
| 7. Dashboard cluster | dashboard/page, BranchManager | 2 files | Medium |
| 8. Business form | BusinessForm (large — own group) | 1 file | Medium |
| 9. Commerce | SubscriptionCard (+ currency decision) | 1 file | Medium |
| 10. Admin cluster | admin/page, admin/categories/page, AdminNav, BusinessTable, CategoryManager | 5 files | Low |
| 11. Consistency pass | terminology alignment across JSON files per `terminology.md` | 2 files | Low |

Each group: one commit, zero logic/styling changes, build must pass before commit.
