/**
 * The `where` every public discovery surface shares.
 *
 * Two conditions, and both must hold for a business to be discoverable:
 *
 * - `status: "APPROVED"` — the existing gate. Unchanged.
 * - `isDemo: false` — outreach demo profiles are DinLinks examples, not real
 *   companies. They stay reachable at their own /business/<id> URL so they can
 *   be linked from outreach email, and are kept out of the homepage, Search,
 *   the category pages, every count derived from those, and the similar-business
 *   block on real profiles.
 *
 * Defined once rather than repeated at each call site so the rule is greppable
 * and a discovery query added later inherits it by using this constant. It is
 * deliberately NOT applied in `app/[locale]/business/[id]/page.tsx`'s own
 * lookup — that page is exactly where a demo must still resolve.
 */
export const PUBLIC_DISCOVERY_WHERE = {
  status: "APPROVED",
  isDemo: false,
} as const;
