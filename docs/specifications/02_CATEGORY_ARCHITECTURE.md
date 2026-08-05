# Category Architecture Specification

## Purpose

This document defines the category architecture for DinLinks.

Its purpose is to create a scalable, predictable, and user-friendly category system that can support millions of businesses without becoming difficult to navigate.

This specification complements the Search Experience Standard.

---

# Mission

Categories should help users discover the right business as quickly as possible.

The category system exists to simplify discovery, not to create unnecessary complexity.

---

# Core Principle

Users think in broad categories first.

They refine their search only when necessary.

DinLinks should mirror this natural behavior.

---

# Category Hierarchy

DinLinks uses a hierarchical category system.

Level 1
Main Categories

↓

Level 2
Subcategories

↓

Level 3 (optional)
Specializations

The hierarchy should remain shallow and predictable.

Avoid deeply nested category trees.

---

# Main Categories

The homepage should display only high-level categories.

Examples include:

- Mat
- Shopping
- Tjenester
- Administrasjon
- Helse
- Bil

Future categories may include:

- Bolig
- Utdanning
- Sport & Fritid
- Dyr
- Finans
- Reise
- Kultur

Main categories should remain stable over time.

---

# Subcategories

Each main category contains relevant subcategories.

Example:

Mat

- Restaurant
- Café
- Bar
- Bakeri
- Fast Food
- Catering

---

Shopping

- Clothing
- Electronics
- Furniture
- Grocery
- Flowers

---

Tjenester

- Elektriker
- Rørlegger
- Tømrer
- Renhold
- Flytting
- Maler

---

Administrasjon

- Advokat
- Regnskapsfører
- Revisor
- Konsulent
- Eiendomsmegler

---

Helse

- Lege
- Tannlege
- Psykolog
- Fysioterapeut
- Optiker
- Apotek

---

Bil

- Bilverksted
- Bilforhandler
- Bilpleie
- Dekk
- EU-kontroll

---

# Specializations

Some industries require another level.

Example:

Restaurant

↓

Italian

Japanese

Thai

Indian

Pizza

Burger

Sushi

Specializations should only exist where they improve discovery.

Never add unnecessary levels.

---

# One Primary Category

Every business must have exactly one primary category.

The primary category determines:

- Search ranking
- Navigation
- SEO
- Category pages

---

# Secondary Categories

Businesses may have secondary categories when relevant.

Example:

A café that also serves lunch.

Primary

- Café

Secondary

- Restaurant

Secondary categories improve discovery.

They must never replace the primary category.

---

# Category Selection

Businesses should choose:

1 Primary Category

Optional Secondary Categories

Avoid allowing too many categories.

More categories should not increase visibility unfairly.

---

# Hero Section

The homepage should only display Main Categories.

Users should never see hundreds of subcategories on the homepage.

The Hero should remain simple.

---

# Search

Users may search by:

- Business Name
- Main Category
- Subcategory
- Service
- Keywords

Search should understand relationships.

Example:

Searching for "Advokat"

should return businesses whose category is

Administrasjon → Advokat

---

# Search Suggestions

Suggestions may include:

- Businesses
- Main Categories
- Subcategories
- Services

Suggestions should reduce typing.

---

# Category Pages

Every Main Category has its own page.

Every Subcategory has its own page.

These pages improve navigation and SEO.

Example

/categories/mat

/categories/mat/restaurant

/categories/tjenester/elektriker

---

# Business Pages

Business pages should display:

Main Category

↓

Subcategory

Example

Tjenester

Elektriker

This helps users understand where the business belongs.

---

# Navigation

Navigation should expose only Main Categories.

Subcategories should appear after entering a category.

---

# SEO

Every category should have:

- Unique URL
- Unique title
- Unique description

Category pages should be indexable.

---

# Scalability

The architecture should support:

Thousands of categories

Millions of businesses

Without requiring structural changes.

---

# Future Expansion

New categories should be added without changing the hierarchy.

The architecture should remain stable as DinLinks grows internationally.

---

# Key Principle

A category system should make discovery easier.

If adding a category makes discovery more difficult, it should be reconsidered.