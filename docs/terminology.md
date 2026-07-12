# DinLinks Terminology Dictionary

> Version 1.0 · Status: Draft for approval · This dictionary is **binding**: every UI string, translation key, and document must use these exact terms. One concept = one word per language.

Marked ⚠ = the codebase currently uses more than one word for this concept (see `language-audit.md`).
Marked ◇ = reserved term, not yet used in the product.

---

## Core platform terms

| Concept | English (approved) | Norwegian (approved) | Notes |
|---|---|---|---|
| Business | business | bedrift | ⚠ Never "company"/«firma» or «selskap». The platform noun. |
| Company ◇ | business | bedrift | Deliberately merged into "business" — do not introduce a second term. |
| Business owner | business owner | bedriftseier | |
| Verified | verified | verifisert | Core trust word. Never "approved" in public UI (see Status below). |
| Category | category | kategori | |
| Profile | profile | profil | «bedriftsprofil» when ambiguous. |
| Branch | branch | filial | ⚠ Never «avdeling». Main branch = «hovedfilial». |
| Directory | business directory | bedriftskatalog | Used in brand tagline. |

## Actions

| Concept | English | Norwegian | Notes |
|---|---|---|---|
| Search | search | søk | Verb and noun. |
| Filter | filter | filter / filtrer (verb) | |
| Sign in | sign in | logg inn | ⚠ Currently also "Sign In" (title case) — sentence case only. Never "log in" in English UI. |
| Sign out | sign out | logg ut | |
| Register | register | registrer | «Registrer bedrift» is the standard CTA. |
| Create profile | create profile | opprett profil | |
| Claim business ◇ | claim business | overta bedriftsprofil | Reserved for future feature. |
| Save | save | lagre | |
| Save changes | save changes | lagre endringer | |
| Share | share | del | |
| Book | book now | book nå | Accepted anglicism in Norwegian; alternative «bestill» only if product later requires it — pick one, never both. |
| Edit | edit | rediger | |
| Delete | delete | slett | Destructive; always name the object. |
| Cancel | cancel | avbryt | |
| Approve | approve | godkjenn | Admin action. |
| Reject | reject | avvis | Admin action. |
| Contact | contact | kontakt | |
| View all | view all | se alle | |
| Learn more | learn more | les mer | |

## Business profile content

| Concept | English | Norwegian | Notes |
|---|---|---|---|
| Opening hours | opening hours | åpningstider | ⚠ Never "business hours". |
| Address | address | adresse | |
| Website | website | nettsted | ⚠ Never «nettside» or «hjemmeside». |
| Phone number | phone | telefon | Label form; "phone number"/«telefonnummer» in prose. |
| Email | email | e-post | Norwegian always hyphenated: «e-post». |
| Location | location | beliggenhet | Map/section context. «plassering» is banned. |
| Map | map | kart | |
| Description | description | beskrivelse | |
| Services | services | tjenester | |
| Products ◇ | products | produkter | Reserved. |
| Photos | photos | bilder | UI section label. |
| Gallery | gallery | galleri | Admin/internal contexts only; public UI uses "Photos"/«Bilder». |
| Employee ◇ | employee | ansatt | Reserved. |
| Founded ◇ | founded | etablert | Reserved. |
| Announcements ◇ | announcements | kunngjøringer | Reserved. |
| Posts ◇ | posts | innlegg | Reserved. |

## Reviews & engagement

| Concept | English | Norwegian | Notes |
|---|---|---|---|
| Review | review | anmeldelse | |
| Rating | rating | vurdering | The star value; a review contains a rating. |
| Favourites | favourites | favoritter | ⚠ Codebase mixes "Favorites"/"Favourites". Approved: **British "favourites"** (consistent with en-GB dates). Key names in JSON may keep US spelling — display strings must not. |
| Profile views | profile views | profilvisninger | |

## Account & commerce

| Concept | English | Norwegian | Notes |
|---|---|---|---|
| Dashboard | dashboard | dashboard | Accepted anglicism; «kontrollpanel» is banned. |
| Settings ◇ | settings | innstillinger | Reserved (no settings page yet). |
| Subscription | subscription | abonnement | |
| Plan | plan | plan | «Månedlig plan» / «Årlig plan». |
| Premium ◇ | premium | premium | Reserved. |
| Free | free | gratis | |

## Status vocabulary (admin & owner-facing)

| Concept | English | Norwegian | Notes |
|---|---|---|---|
| Approved | approved | godkjent | Internal review status. Public badge says "Verified"/«Verifisert», never "Approved". |
| Pending | pending review | venter på gjennomgang | Short form «Venter» in table cells. |
| Rejected | rejected | avvist | |
| Open | open | åpent | Opening-hours state. |
| Closed | closed | stengt | |
| Open now | open now | åpent nå | |
| Closed now | closed now | stengt nå | |

## Fixed brand strings (never translated)

- **DinLinks** — always exactly this casing.
- **ADMIN** badge — all caps in both languages.
- Locale switch labels **EN / NO** — ISO codes, not words.

---

## Conflict resolution

If a new string needs a term not in this dictionary: add the term here first (one English word, one Norwegian word), then use it. Do not invent synonyms in JSON files.
