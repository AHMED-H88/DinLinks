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

---

# Approved Categories — v1

DinLinks Taxonomy v1 contains exactly eight top-level Categories.

---

## 🍽️ Mat og drikke

Slug:

```text
mat
```

### Subcategories

| Display name | Slug |
|---|---|
| Restaurant | restaurant |
| Kafé | cafe |
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
| restaurant | Mat og drikke |
| cafe | Mat og drikke |
| handverk | Tjenester |

The existing slugs must remain unchanged.

The display name for `cafe` becomes `Kafé`, while its slug remains `cafe`.

## New top-level Categories to create

The following top-level Categories will be created during the approved taxonomy migration:

- `mat`
- `bil`
- `utdanning`
- `dyr`

## Existing businesses on top-level Categories

Businesses currently assigned directly to a Category that will remain top-level must be reassigned to an approved Subcategory before the migration is considered complete.

This includes businesses assigned directly to:

- `administrasjon`
- `helse`
- `shopping`
- `tjenester`

## Category to remove

The following Category will be removed only after all businesses have been reassigned:

- `annet`

Before removal:

- It must contain no businesses.
- It must contain no child Categories.
- Every affected business must have an explicitly approved replacement Subcategory.
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
- A `Vis alle` action when the full list is hidden.

This is a UX inspiration only.

The official DinLinks taxonomy structure and naming must always follow this document.

---

# Version

- Version: 1.0
- Created: 2026-08-03
- Last updated: 2026-08-05
- Status: Approved
- Owner: DinLinks

This document is the official taxonomy reference and the sole source of truth for DinLinks Taxonomy v1.