# DinLinks Taxonomy Master List

## Purpose

This document is the official source of truth for the DinLinks taxonomy.

All categories, subcategories, database migrations, seed data, search filters, homepage shortcuts, dashboard forms, business registration flows, and future taxonomy-related features must follow this document.

No taxonomy change may be implemented in the database or application code before this document has been updated and approved.

---

# Core Principles

- The taxonomy has exactly two levels:
  - Category
  - Subcategory
- The hierarchy is always:
  - Category → Subcategory
- Every business belongs to exactly one Subcategory.
- A business cannot be assigned directly to a top-level Category.
- The parent Category is derived automatically from the selected Subcategory.
- Every Subcategory belongs to exactly one top-level Category.
- Every top-level Category has no parent.
- No third taxonomy level is allowed.
- There is no `Annet` category.
- There is no `Generelt` category.
- Categories and Subcategories must have globally unique slugs.
- Slugs are permanent after creation.
- Existing slugs must never be renamed.
- Deleted slugs must never be reused for a different meaning.
- Display names may be changed without changing their slugs.
- Slugs must use lowercase ASCII characters and hyphens only.
- Norwegian is the canonical language for display names.
- English display names are managed through localization files.
- Localization must never change the canonical slug.
- Homepage category shortcuts must display top-level Categories only.
- Subcategories must never appear beside top-level Categories as if they were the same level.

---

# Naming Standards

- The approved Norwegian display name is `Mat`.
- Do not use `Mat og drikke` as the top-level Category name.
- The approved Norwegian display name is `Kafe`.
- Do not use accented variants of `Kafe`.
- The permanent slug for `Kafe` remains `cafe`.
- Norwegian letters `æ`, `ø`, and `å` are allowed.
- Other accented Latin characters should not be used in DinLinks-owned taxonomy display names unless explicitly approved.
- Registered business names and external data must never be automatically rewritten.

---

# Approved Categories — v1

DinLinks Taxonomy v1 contains exactly eight top-level Categories.

| Norwegian display name | English display name | Slug |
|---|---|---|
| Mat | Food | mat |
| Shopping | Shopping | shopping |
| Tjenester | Services | tjenester |
| Helse | Health | helse |
| Bil | Automotive | bil |
| Utdanning | Education | utdanning |
| Administrasjon | Administration | administrasjon |
| Dyr | Animals | dyr |

---

## 🍽️ Mat

Slug:

```text
mat
```

### Subcategories

| Display name | Slug |
|---|---|
| Restaurant | restaurant |
| Kafe | cafe |
| Bakeri | bakeri |
| Bar | bar |
| Catering | catering |
| Gatekjøkken | gatekjokken |

---

## 🛒 Shopping

Slug:

```text
shopping
```

### Subcategories

| Display name | Slug |
|---|---|
| Elektronikk | elektronikk |
| Klær | klaer |
| Dagligvare | dagligvare |
| Møbler | mobler |
| Smykker | smykker |
| Blomster | blomster |
| Sport | sport |

---

## 🛠️ Tjenester

Slug:

```text
tjenester
```

### Subcategories

| Display name | Slug |
|---|---|
| Elektriker | elektriker |
| Rørlegger | rorlegger |
| Tømrer | tomrer |
| Maler | maler |
| Renhold | renhold |
| Flyttebyrå | flyttebyra |
| Frisør | frisor |
| Skjønnhetssalong | skjonnhetssalong |
| Låsesmed | lasesmed |
| IT-tjenester | it-tjenester |
| Håndverk | handverk |

### Håndverk usage rule

`Håndverk` is retained for legacy compatibility and for businesses that provide broad or multiple trade services.

A more specific Subcategory must always be preferred whenever it accurately describes the business.

Examples:

- Use `Elektriker` instead of `Håndverk` for an electrical company.
- Use `Rørlegger` instead of `Håndverk` for a plumbing company.
- Use `Tømrer` instead of `Håndverk` for a carpentry company.
- Use `Maler` instead of `Håndverk` for a painting company.

`Håndverk` should only be used when no approved specific trade Subcategory accurately represents the business.

---

## 🏥 Helse

Slug:

```text
helse
```

### Subcategories

| Display name | Slug |
|---|---|
| Lege | lege |
| Tannlege | tannlege |
| Psykolog | psykolog |
| Fysioterapeut | fysioterapeut |
| Kiropraktor | kiropraktor |
| Optiker | optiker |
| Apotek | apotek |

---

## 🚗 Bil

Slug:

```text
bil
```

### Subcategories

| Display name | Slug |
|---|---|
| Bilverksted | bilverksted |
| Bilforhandler | bilforhandler |
| Bilpleie | bilpleie |
| Dekk | dekk |
| Bilutleie | bilutleie |
| EU-kontroll | eu-kontroll |

---

## 🎓 Utdanning

Slug:

```text
utdanning
```

### Subcategories

| Display name | Slug |
|---|---|
| Skole | skole |
| Barnehage | barnehage |
| Språkskole | sprakskole |
| Kurs | kurs |

---

## 🏢 Administrasjon

Slug:

```text
administrasjon
```

### Subcategories

| Display name | Slug |
|---|---|
| Advokat | advokat |
| Regnskapsfører | regnskapsforer |
| Revisor | revisor |
| Eiendomsmegler | eiendomsmegler |
| Konsulent | konsulent |
| Forsikring | forsikring |

---

## 🐶 Dyr

Slug:

```text
dyr
```

### Subcategories

| Display name | Slug |
|---|---|
| Veterinær | veterinar |
| Dyrebutikk | dyrebutikk |
| Hundesalong | hundesalong |
| Dyrepensjonat | dyrepensjonat |

---

# Business Assignment Rules

- Every business must be assigned to one approved Subcategory.
- A business must never be assigned directly to a top-level Category.
- A business may only have one primary Subcategory in Taxonomy v1.
- The top-level Category must be derived from the selected Subcategory.
- The most specific accurate Subcategory must be selected.
- Broad Subcategories must not be used when a more precise approved option exists.
- A missing Subcategory must not be replaced with `Annet`, `Generelt`, or another unrelated option.
- When no approved Subcategory fits, the Taxonomy Master List must be reviewed before creating a new slug.
- New Categories or Subcategories require founder approval before implementation.
- Database migrations, seed data, forms, filters, and UI labels must use the canonical slugs defined in this document.

---

# Homepage and Category UX Rules

- The Homepage must display top-level Categories only.
- The approved Homepage shortcuts are:
  - Mat
  - Shopping
  - Tjenester
  - Helse
  - Bil
  - Administrasjon
- `Utdanning` and `Dyr` may appear through `Se alle kategorier` when only six shortcuts are displayed.
- `Restaurant`, `Kafe`, `Håndverk`, and all other Subcategories must not appear beside top-level Categories.
- Selecting a top-level Category opens or filters to its Subcategories.
- Selecting a Subcategory shows businesses assigned to that Subcategory.
- Business counts may be shown for Categories and Subcategories.
- Empty Subcategories may be hidden from public result pages while remaining available in registration and administration flows.
- Mobile category controls should be collapsed by default and should close after a selection.
- The category experience must clearly communicate the difference between Category and Subcategory.

Example:

```text
Mat
├── Restaurant
├── Kafe
├── Bakeri
├── Bar
├── Catering
└── Gatekjøkken
```

---

# Migration Notes — v1 Rollout

These notes describe the database state before the Taxonomy v1 data migration.

They are implementation notes only and do not redefine the approved taxonomy.

## Existing top-level Categories to retain

The following existing Categories remain top-level Categories:

- `administrasjon`
- `helse`
- `shopping`
- `tjenester`

## Existing Categories to reparent

The following existing Categories become Subcategories:

| Existing slug | New parent Category |
|---|---|
| restaurant | Mat |
| cafe | Mat |
| handverk | Tjenester |

The existing slugs must remain unchanged.

The display name for `cafe` becomes `Kafe`, while its slug remains `cafe`.

## New top-level Categories to create

The following top-level Categories will be created during the approved taxonomy migration:

- `mat`
- `bil`
- `utdanning`
- `dyr`

## Existing test businesses

The five businesses currently in Production are test profiles used to validate the product during development.

They must remain available until DinLinks is ready to begin registering the first real pilot businesses.

The test profiles may be temporarily reassigned to approved Subcategories during the Taxonomy v1 migration so the interface, filters, profile pages, and search behavior can continue to be tested.

Temporary assignments do not define the real-world classification of these profiles and must not change the approved taxonomy.

Approved temporary assignments:

| Test business | Temporary Category | Temporary Subcategory |
|---|---|---|
| Maaemo | Mat | Restaurant |
| Elkjøp Ullevål | Shopping | Elektronikk |
| Cutters Storo | Tjenester | Frisør |
| TEST AS | Helse | Fysioterapeut |
| DAVIDOFF | Shopping | Klær |

The five test profiles will be deleted before the first real pilot businesses are registered.

Their deletion is a separate controlled operation and is not part of the Taxonomy v1 data migration.

## Existing businesses on top-level Categories

No business may remain assigned directly to a top-level Category after the migration.

Any test business currently assigned directly to a top-level Category must be moved to its approved temporary Subcategory during the migration.

## Category to remove

The following Category must be removed after its businesses have been reassigned:

- `annet`

Before removal:

- It must contain no businesses.
- It must contain no child Categories.
- Every affected business must have an explicitly approved temporary or permanent replacement Subcategory.
- The migration validation checks must pass.

---

# Migration Safety Rules

Before applying the Taxonomy v1 data migration:

- A current database backup must exist.
- The current Category table must be exported or captured.
- The current business-to-category assignments must be captured.
- Every affected business must have an approved target Subcategory.
- The migration must run inside a transaction where supported.
- The migration must stop on unexpected data.
- No production data may be guessed or fabricated.
- No business may remain assigned directly to a top-level Category.
- No business may remain assigned to `annet`.
- No third-level Category may be created.
- No approved existing slug may be renamed.
- Validation queries must pass before the migration is considered complete.
- Production migration requires explicit final approval.

## Required post-migration validation

The migration is complete only when all checks pass:

- Exactly eight top-level Categories exist.
- The top-level slugs are exactly:
  - `mat`
  - `shopping`
  - `tjenester`
  - `helse`
  - `bil`
  - `utdanning`
  - `administrasjon`
  - `dyr`
- Every Subcategory has exactly one top-level parent.
- No Category exists below the Subcategory level.
- Every business is assigned to a Subcategory.
- No business is assigned directly to a top-level Category.
- `restaurant` and `cafe` have parent `mat`.
- `handverk` has parent `tjenester`.
- The display name for `cafe` is `Kafe`.
- No `annet` or `generelt` slug exists.
- Existing approved slugs remain unchanged.
- Homepage category queries return top-level Categories only.
- Category and business row counts reconcile with the pre-migration snapshot.

---

# Rollback Requirements

A rollback plan must exist before the migration is executed.

The preferred rollback method is restoring the verified database backup.

A manual rollback script may also be prepared and must be able to:

- Restore the original business-to-category assignments.
- Remove newly created Categories and Subcategories.
- Restore the previous flat Category structure where required.
- Recreate `annet` only as part of rollback to the captured pre-migration state.
- Restore the original display name for `cafe` only if required by the captured pre-migration state.

No rollback may reuse a slug for a different meaning.

---

# Future Expansion

The following Categories are intentionally deferred and are not part of Taxonomy v1:

- Overnatting
- Fritid og opplevelser

They must not be created during the Taxonomy v1 migration and must not be included in v1 seed data.

Future Categories and Subcategories may be added without redesigning the hierarchy, provided that:

- The two-level structure is preserved.
- Existing slugs remain unchanged.
- New slugs are unique.
- The Taxonomy Master List is updated and approved first.
- Database and application changes happen only after documentation approval.

---

# UX Reference

The DinLinks category experience may take inspiration from clear Norwegian filtering interfaces that use:

- Search within Categories and Subcategories.
- Collapsible filter sections.
- Visible business counts.
- Clear selection controls.
- A `Se alle kategorier` action when the full list is hidden.

This is a UX inspiration only.

The official DinLinks taxonomy structure and naming must always follow this document.

---

# Version

- Version: 1.1
- Created: 2026-08-03
- Last updated: 2026-08-06
- Status: Approved
- Owner: DinLinks

This document is the official taxonomy reference and the sole source of truth for DinLinks Taxonomy v1.
