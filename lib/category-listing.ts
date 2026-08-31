/**
 * The one authoritative parser for the category listing's recognized query
 * parameters (`page`, `sort`). Pure and unit-tested; generateMetadata and the
 * page renderer both consume it, so they can never disagree about what a URL
 * means.
 *
 * Contract:
 * - Invalid means hard 404 (`null`) — never a silent fallback to page 1.
 *   Invalid covers: non-digit or empty page, `0`, signs, decimals, trailing
 *   garbage, whitespace, unsafe/huge integers, duplicate page or sort values
 *   (arrays), and any sort outside the four approved values.
 * - Non-canonical FORM of valid values redirects once: `?page=1`, leading
 *   zeros (`?page=01`, `?page=002`) and the explicit default `?sort=popular`
 *   normalize to the canonical form in ONE hop, preserving unrelated
 *   parameters (campaign tracking) — which are never part of canonical or
 *   hreflang URLs themselves.
 * - Canonical search is `""` for page 1 and `?page=N` for page 2+, always in
 *   default-sort form: alternative orderings are noindexed variants that
 *   canonicalize to the corresponding default-sort page.
 */

export const CATEGORY_SORTS = ["popular", "reviewed", "newest", "alpha"] as const;
export type CategorySort = (typeof CATEGORY_SORTS)[number];

export type RawSearchParams = { [key: string]: string | string[] | undefined };

export type CategoryListingQuery = {
  page: number;
  sort: CategorySort;
  /** True for the three non-default orderings — noindex, no hreflang, no ItemList. */
  isSorted: boolean;
  /** Canonical search suffix: "" (page 1) or `?page=N` — never a sort. */
  canonicalSearch: string;
  /**
   * Non-null when the recognized params are valid but in non-canonical form:
   * the complete one-hop redirect target's search string ("" = bare path).
   * Unrelated parameters ride along so campaign data survives the hop.
   */
  redirectSearch: string | null;
};

// Digits only, bounded well inside Number.MAX_SAFE_INTEGER so the numeric
// value is always exact. Rejects "", signs, decimals, whitespace, suffixes.
const PAGE_RE = /^\d{1,15}$/;

export function parseCategoryListingQuery(
  searchParams: RawSearchParams,
): CategoryListingQuery | null {
  const rawPage = searchParams.page;
  const rawSort = searchParams.sort;

  // Next exposes repeated parameters as arrays — ambiguous, so refused.
  if (Array.isArray(rawPage) || Array.isArray(rawSort)) return null;

  let page = 1;
  let pageNonCanonical = false;
  if (rawPage !== undefined) {
    if (!PAGE_RE.test(rawPage)) return null;
    page = Number(rawPage);
    if (page < 1) return null;
    // "1" (page 1 belongs on the bare URL) and "01"/"002" (leading zeros).
    pageNonCanonical = page === 1 || rawPage !== String(page);
  }

  let sort: CategorySort = "popular";
  let sortNonCanonical = false;
  if (rawSort !== undefined) {
    if (!(CATEGORY_SORTS as readonly string[]).includes(rawSort)) return null;
    sort = rawSort as CategorySort;
    // The default ordering never appears in a URL explicitly.
    sortNonCanonical = sort === "popular";
  }

  let redirectSearch: string | null = null;
  if (pageNonCanonical || sortNonCanonical) {
    const target = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || key === "sort") continue;
      if (Array.isArray(value)) for (const v of value) target.append(key, v);
      else if (value !== undefined) target.append(key, value);
    }
    if (sort !== "popular") target.set("sort", sort);
    if (page > 1) target.set("page", String(page));
    const qs = target.toString();
    redirectSearch = qs ? `?${qs}` : "";
  }

  return {
    page,
    sort,
    isSorted: sort !== "popular",
    canonicalSearch: page > 1 ? `?page=${page}` : "",
    redirectSearch,
  };
}
