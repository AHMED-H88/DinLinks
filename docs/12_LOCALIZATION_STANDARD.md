# Localization Standard

## Purpose

Localization is a core part of the DinLinks experience.

Every user should feel that the product was built for their language, not translated into it.

---

# Mission

Provide a consistent, professional, and natural experience across every supported language.

---

# Supported Languages

DinLinks supports multiple languages.

Each language should provide the same information, functionality, and user experience.

No language should be treated as a secondary product.

---

# Translation Principles

Translations should be:

- Accurate
- Natural
- Consistent
- Context-aware

Never translate word-for-word if it reduces clarity.

---

# Terminology

Core product terminology must remain consistent across the platform.

Terms such as:

- Verified
- Business
- Category
- Review
- Service
- Location

must always use the approved terminology for each language.

---

# Source Language

Every piece of content should have one source language.

Translations should always originate from the source language.

Translations should never be translated from another translation.

---

# User Interface

Every interface element should be localized.

Examples:

- Buttons
- Menus
- Forms
- Error messages
- Empty states
- Notifications
- Validation messages

No user-facing text should remain untranslated.

---

# Dynamic Content

Business information provided by businesses may remain in its original language.

System-generated content must always be localized.

---

# Date, Time and Numbers

Dates, times, currencies and number formats should follow the conventions of the selected language and region.

---

# Accessibility

Localization must never reduce usability.

Translated text should remain:

- Readable
- Accessible
- Consistent

Layouts should accommodate longer translations when necessary.

---

# Development Rules

User-facing text should never be hardcoded into components.

All translatable text should use the localization system.

New features must include translations before release.

---

# Quality Assurance

Before release, every supported language should be reviewed for:

- Missing translations
- Incorrect translations
- Mixed languages
- Broken layouts
- Truncated text

---

# Future Expansion

The localization system should support adding new languages without requiring major architectural changes.

---

# Character Standard

This rule governs which characters are allowed in DinLinks-owned user-facing copy.

- DinLinks-owned user-facing copy must use plain Latin characters whenever an accepted Norwegian form exists.
- Use Kafe instead of Kafé.
- The Norwegian letters æ, ø, and å remain allowed.
- Other accented Latin characters such as é, è, ê, á, à, ó, ò, and similar forms must not be used in DinLinks-owned UI copy unless explicitly approved.
- Registered business names, user content, addresses, and external data must never be automatically rewritten.

The automated check `npm run check:copy-characters` enforces this rule for `messages/no.json` and `messages/en.json`.

---

# Key Principle

A translated product should feel native, not translated.