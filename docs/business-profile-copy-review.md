# Business Profile — Copy & UX Review

> Version 1.0 · Documentation only — no code changed.
> Scope: every visible string on `app/[locale]/business/[id]/page.tsx` and its child components (ProfileGallery, ReviewForm, ReviewList, BranchesSection), as stored in the `profile` namespace of `messages/en.json` / `messages/no.json`.
> Grounded in the rendered page structure (verified in code): hero → action row → About / Photos / Services / Branches / Reviews / Similar → sidebar (Contact → Opening hours → Location → Profile info).

Priorities: **P1** = fix before launch (wrong register, overclaim, or bug) · **P2** = clear improvement · **P3** = polish/hygiene.

---

## 1. Hero & status badges

| Key | Current EN | Current NO | Proposed | Why | Priority |
|---|---|---|---|---|---|
| `hero.verified` | Verified | Verifisert | **unchanged** | Single-word badge; the core trust mark. | — |
| `hero.openNow` / `closedNow` | Open now / Closed now | Åpent nå / Stengt nå | **unchanged** | Best decision-driving copy on the page. | — |
| `hero.branchSingular/Plural` | branch/branches | filial/filialer | **unchanged** | Correct terminology. Note: line 322 still hardcodes these as an `isNo` ternary — wire to keys (already in audit). | P1 (wiring, not wording) |

## 2. Action row & CTA

| Key | Current EN | Current NO | Proposed EN | Proposed NO | Why | Priority |
|---|---|---|---|---|---|---|
| `actions.bookNow` | Book now | Book nå | *replaced by dynamic CTA — see §3* | | One verb for all business types undersells most of them. | P1 |
| `actions.call` | Call | Ring | **unchanged** | | Sharp, correct. | — |
| `actions.website` | Website | Nettsted | **unchanged** | | Matches terminology. | — |
| `actions.directions` | Directions | Veibeskrivelse | **unchanged** | | Natural in both languages. | — |
| `actions.share` | Share | Del | **unchanged** | | | — |
| `actions.copied` | Copied! | Kopiert! | **unchanged** | | Genuine success moment; the one allowed `!`. | — |

## 3. Dynamic CTA strategy (design, not yet implemented)

**Mechanism — zero backend changes required.** The business already carries `category` (with slug) and `bookingLink`. The CTA label becomes a pure-frontend lookup:

1. A small map in the page component: `categorySlug → ctaKey`, fallback `"contactBusiness"`.
2. New keys under `profile.cta.*` (added to both JSON files when implemented).
3. The button renders only when `bookingLink` exists (unchanged condition). When there is no `bookingLink`, the existing fallback chain already does the right thing: phone → "Call", website → "Website".

| Business type (category slug examples) | English CTA | Norwegian CTA |
|---|---|---|
| Restaurant, café (`restaurant`, `cafe`) | Book a table | Bestill bord |
| Hair salon, clinic, dentist, physio (`frisor`, `klinikk`, `tannlege`) | Book an appointment | Bestill time |
| Lawyer, accountant (`advokat`, `regnskap`) | Contact the office | Kontakt kontoret |
| Electrician, plumber, builder (`elektriker`, `rorlegger`) | Request a quote | Be om tilbud |
| Consultant (`konsulent`) | Get in touch | Ta kontakt |
| **Fallback — all others** | Contact business | Kontakt bedriften |

Notes:
- «Bestill time» and «Bestill bord» are what Norwegians actually say — this alone makes the page feel native.
- The map must live in one exported constant so new categories get CTAs without touching page logic.
- The exact slug list must be checked against the production categories table before implementation (slugs above are assumptions).
- «Book nå» disappears entirely; "Book" as a Norwegian verb is tolerated but «Bestill» is better Bokmål (supersedes the terminology.md entry — update it when implemented).

## 4. Section titles

| Key | Current EN | Current NO | Proposed EN | Proposed NO | Why | Priority |
|---|---|---|---|---|---|---|
| `sections.about` | About | Om bedriften | **About this business** | Om bedriften | NO already says "about the business"; EN should match that specificity. Also requested explicitly in the brief. | P1 |
| `sections.photos` | Photos | Bilder | **unchanged** | | | — |
| `sections.services` | Services | Tjenester | **unchanged** | | | — |
| `sections.branches` | Branches | Filialer | **unchanged** | | Binding terminology. | — |
| `sections.reviews` | Reviews | Anmeldelser | **unchanged** | | | — |
| `sections.similar` | Similar businesses | Lignende bedrifter | **unchanged** | | Clear and honest; "You might also like" would be false personalization. | — |

## 5. About & gallery

| Key | Current | Proposed | Why | Priority |
|---|---|---|---|---|
| `about.empty` | "No description provided yet." / «Ingen beskrivelse lagt til ennå.» | EN: **"This business hasn't written a description yet."** NO: **«Bedriften har ikke skrevet en beskrivelse ennå.»** | Names the actor; "provided" is form-speak. Neutral, not blaming. | P2 |
| `gallery.close/previous/next` | Close/Previous/Next · Lukk/Forrige/Neste | **unchanged** | Standard aria labels. | — |
| `gallery.rateStar` | (duplicate of `reviewForm.rateStar`) | **delete key** | Dead duplicate — gallery has no stars. Key hygiene only. | P3 |

## 6. Reviews experience

| Key | Current EN | Current NO | Proposed EN | Proposed NO | Why | Priority |
|---|---|---|---|---|---|---|
| `reviews.signIn` + `signInToReview` | "Sign in" + "to leave a review." | «Logg inn» + «for å skrive en anmeldelse.» | "Sign in" + **"to write a review."** | unchanged | «skrive» = write; EN "leave" is fine but "write" matches NO and the form title ("Write a review"). Two-part key is acceptable since the link wraps only the verb. | P2 |
| `reviews.noReviews` | No reviews yet | Ingen anmeldelser ennå | **unchanged** | | Textbook empty state… | — |
| `reviews.beFirst` | Be the first to share your experience. | Vær den første til å dele din erfaring. | **unchanged** | | …with a textbook invitation. Keep. | — |
| `reviews.reviewSingular/Plural` | review/reviews | anmeldelse/anmeldelser | **unchanged** — but fix the **bug**: the trust-card row (page line ~793) always uses `reviewPlural`, so one review renders as "1 reviews" / «1 anmeldelser». | | Grammar bug visible to users. | **P1** |

### Review form

| Key | Current | Proposed | Why | Priority |
|---|---|---|---|---|
| `reviewForm.ratingFair` | Fair / «OK» | EN unchanged / NO: **«Grei»** | «OK» reads as a shrug; «Grei» is the natural Norwegian scale word. | P2 |
| `reviewForm.ratingVeryGood` | Very good / «Meget bra» | EN unchanged / NO: **«Veldig bra»** | «Meget» is dated officialese; nobody under 60 says it. | P2 |
| `reviewForm.title, yourRating, yourExperience, placeholder, submit, submitting, successTitle, successBody, writeAnother, error*` | — | **unchanged** | Already follow the brand formulas (success: short + thanks; errors: what + how to fix). | — |

## 7. Sidebar cards

| Key | Current EN | Current NO | Proposed EN | Proposed NO | Why | Priority |
|---|---|---|---|---|---|---|
| `sidebar.contact` | Contact | Kontakt | **unchanged** | | Card header; short is right. | — |
| `sidebar.phone/email/website` | Phone/Email/Website | Telefon/E-post/Nettsted | **unchanged** | | | — |
| `sidebar.visitWebsite` | Visit website | Besøk nettsted | **unchanged** | | | — |
| `sidebar.openingHours` | Opening hours | Åpningstider | **unchanged** | | | — |
| `sidebar.open/closed` | Open/Closed | Åpent/Stengt | **unchanged** | | | — |
| `sidebar.location` | Location | Beliggenhet | **unchanged** | | | — |
| `sidebar.openInMaps` | Open in Maps | Åpne i kart | **unchanged** | | | — |
| `sidebar.profileInfo` | Profile info | Om denne profilen | **"About this profile"** | unchanged | The brief's own example. NO already has the better wording; EN currently mismatches its register. | **P1** |
| `sidebar.verifiedBusiness` | Verified business | Verifisert bedrift | **unchanged** | | | — |
| `sidebar.approvedBy` | Approved by DinLinks | Godkjent av DinLinks | **"Reviewed and approved by DinLinks"** | **«Gjennomgått og godkjent av DinLinks»** | Says *what the badge means* instead of repeating it. This is the sentence that earns the trust the badge claims. | P1 |
| `sidebar.genuineRatings` | Genuine customer ratings | Ekte kundevurderinger | **"Ratings from customers"** | **«Vurderinger fra kunder»** | "Genuine"/«ekte» is an overclaim — we don't verify reviewers are customers. A trust brand must not assert what it can't back. | **P1** |
| `sidebar.profileViews` | Profile views | Profilvisninger | **remove the row from the public card** (keep key for dashboard) | | View counts help owners, not customers deciding. Worse: a low number actively damages trust. Requires a 4-line JSX removal — deferred to implementation group. | P2 |
| `sidebar.lastUpdated` | Last updated | Sist oppdatert | **unchanged** | | Freshness is a real trust signal. | — |
| `sidebar.bookNow`, `sidebar.website` | (dead keys — page uses `actions.*`) | **delete keys** | Hygiene. | P3 |

### Trust-first: card order recommendation

**Keep the current order** (Contact → Opening hours → Location → About this profile). Reasoning: the hero already answers "can I trust this?" (Verified badge, rating, Open now), so the sidebar's job is action — contact details belong on top where the eye lands. Moving the trust card up would duplicate the hero and push the phone number below the fold. The improvement is in the trust card's *content*, not its position: drop the views row, sharpen the two subtitles (above).

**Future trust fields worth adding** — all require schema fields, so out of scope during the freeze, listed for the roadmap in value order: **Organisasjonsnummer** (the single strongest Norwegian trust signal — links to Brønnøysundregistrene), **payment methods**, **founded year**, **languages spoken**, **accessibility**. Not recommended: employee count (low decision value), response time (needs measurement infrastructure to be honest).

## 8. Metadata

| Key | Current | Proposed | Why | Priority |
|---|---|---|---|---|
| `meta.descriptionFallback` | "{name} is a verified business on DinLinks. Find contact details, opening hours, and reviews." / NO equivalent | **unchanged** | Honest, keyword-sensible. | — |
| `meta.notFound` | Business not found \| DinLinks | **unchanged** — but the string is still hardcoded at page line 60; wire it. | | P1 (wiring) |

---

## 9. What stays unchanged (summary)

The majority. This page's copy is already close to the brand: all action verbs, open/closed states, empty-state pair in reviews, the entire review form flow, opening hours, location, day names, and metadata. **22 of 79 keys have a proposed change; 57 stay as they are.** Restraint is deliberate — rewriting healthy copy creates churn and translation drift.

## 10. Implementation plan (when approved)

One migration group, same workflow as before:
1. JSON-only wording changes (12 keys across both files) — no component edits needed since they're already wired.
2. Three wiring fixes in `page.tsx` (lines 60, 64–72, 322 — already tracked in `language-audit.md`).
3. The `1 reviews` plural bug (one-line conditional).
4. Views-row removal from the public trust card (4 lines JSX).
5. Dynamic CTA: new `profile.cta.*` keys + slug map + swap `t("actions.bookNow")` → `t(ctaKey)` (2 call sites). Needs the real category slug list first.
6. Key deletions (`gallery.rateStar`, `sidebar.bookNow`, `sidebar.website`) last, after confirming zero references.

Build + `tsc` + your review gate before commit, as always.
