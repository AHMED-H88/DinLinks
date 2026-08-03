# DinLinks Brand Language Guide

> Version 1.0 · Status: Draft for approval · Applies to all user-facing text in the DinLinks platform.
> Norwegian (Bokmål) is the primary language. English is the secondary language.

---

## 1. Brand personality

DinLinks is the calm, reliable directory. It behaves like a well-run Norwegian institution: precise, unhurried, and never salesy.

| We are | We are not |
|---|---|
| Professional | Corporate-stiff |
| Clean and direct | Blunt or cold |
| Trustworthy | Boastful |
| Modern | Trend-chasing |
| Simple | Simplistic |

If DinLinks were a person, it would be the colleague who answers questions in one clear sentence, never oversells, and is always right about opening hours.

---

## 2. Tone of voice

**Norwegian (primary):** Naturlig, moderne bokmål. Du-form, aktiv setningsbygning, korte setninger. Skriv slik Vipps, Finn.no og Posten skriver — vennlig, presist, uten utropstegn i annenhver setning.

**English (secondary):** Natural business English with British conventions (matching our `en-GB` date locale). Plain, direct, warm but not chatty.

Rules that apply to both languages:

1. **One idea per sentence.** If a sentence needs a comma and an "and", consider splitting it.
2. **Address the user as "you" / «du».** Never "the user", never «man».
3. **No hype.** Banned words: revolutionary, cutting-edge, world-class, banebrytende, markedsledende, unik (unless literally true).
4. **No AI-sounding filler.** Banned: "Unlock the power of…", "Elevate your…", "Ta din bedrift til neste nivå".
5. **Maximum one exclamation mark per screen**, and only for genuine success moments.
6. **Never mix languages in one view.** A Norwegian page is 100 % Norwegian; an English page is 100 % English. Brand names (DinLinks, Google Maps) are the only exceptions.

---

## 3. Writing principles

1. **Front-load the point.** Put the most important word first: «Bedriften er godkjent» — not «Vi har nå gjennomgått og godkjent bedriften».
2. **Concrete beats abstract.** "Opening hours updated" beats "Your changes have been processed".
3. **Say what happens next.** Every state (error, success, empty) should tell the user what they can do now.
4. **Write for scanning.** Users read the first three words of a line. Make them count.
5. **Consistency over creativity.** The same action always has the same label. See `terminology.md` — it is binding.

---

## 4. Sentence style

- Short sentences. Aim for under 15 words in UI copy, under 20 in body text.
- Active voice: «Vi gjennomgår profilen din» — not «Profilen din vil bli gjennomgått».
- Present tense wherever possible.
- Norwegian: use «—» (tankestrek) sparingly, «·» as list separator in metadata. Quotation marks are «guillemets» in longer prose, straight quotes acceptable in UI.
- English: serial style plain; en dashes for ranges (09:00–17:00).

---

## 5. Capitalization rules

**Sentence case everywhere.** This is the single most common inconsistency in the current codebase.

| Element | Correct (NO) | Correct (EN) | Wrong |
|---|---|---|---|
| Buttons | «Registrer bedrift» | "Register business" | "Register Business" |
| Headings | «Slik fungerer det» | "How it works" | "How It Works" |
| Nav items | «Logg inn» | "Sign in" | "Sign In" |
| Labels | «Åpningstider» | "Opening hours" | "Opening Hours" |

Exceptions: brand names (DinLinks), proper nouns (Norge, Oslo, Google Maps), and the ADMIN badge (deliberate all-caps status marker).

Norwegian never capitalizes nouns mid-sentence. Do not import English title-casing into Norwegian.

---

## 6. Button rules

1. Start with a verb: «Lagre endringer», "Save changes".
2. Two to three words maximum.
3. Describe the outcome, not the mechanics: «Send anmeldelse» — not «Klikk her for å sende».
4. Destructive buttons name the object: «Slett filial» — never just «OK».
5. In-progress states use ellipsis character `…`: «Lagrer…», "Saving…".
6. Never "Submit" alone — always "Submit review" / «Send anmeldelse».

---

## 7. Error message style

Formula: **what happened + how to fix it.** Never blame the user, never apologize theatrically.

| Good (NO) | Good (EN) | Bad |
|---|---|---|
| «Ugyldig e-post eller passord.» | "Invalid email or password." | "Oops! Something went wrong 😢" |
| «Kommentaren må være minst 10 tegn.» | "Comment must be at least 10 characters." | "Error: validation failed" |
| «Noe gikk galt. Prøv igjen.» | "Something went wrong. Please try again." | "An unexpected error has occurred in the system" |

- No exclamation marks in errors.
- No error codes in user-facing text.
- Generic fallback is allowed only when we genuinely don't know the cause.

---

## 8. Success message style

Short confirmation + optional next step. One exclamation mark is permitted here.

- «Anmeldelse sendt!» / "Review submitted!"
- «Profil oppdatert.» / "Profile updated."
- Follow-up line in normal tone: «Takk for at du delte erfaringen din.» / "Thank you for sharing your experience."

---

## 9. Empty state style

Formula: **neutral statement + invitation to act.** Never make emptiness sound like failure.

- «Ingen anmeldelser ennå» + «Vær den første til å dele din erfaring.»
- "No branches yet" + "Add your first branch to show locations on your profile."
- Include the relevant action button when the user can fix the emptiness.

---

## 10. Placeholder style

Placeholders show **examples, not instructions.**

| Field | Placeholder (NO) | Placeholder (EN) |
|---|---|---|
| Business name | «f.eks. Oslo Bilverksted» | "e.g. Oslo Auto Repair" |
| City | «Oslo» | "Oslo" |
| Email | «din@epost.no» | "you@example.com" |
| Phone | «+47 123 45 678» | "+47 123 45 678" |

- Norwegian example prefix: «f.eks.» — English: "e.g."
- Never repeat the field label as placeholder.
- Placeholders are never required reading — all necessary instructions go in labels or helper text.

---

## 11. CTA style

- Primary CTA states the value in the user's words: «Registrer bedriften din» / "Register your business".
- One primary CTA per screen section.
- Secondary CTA is quieter and honest: «Les mer» / "Learn more".
- Never use urgency theatrics ("Only today!", «Skynd deg!»).

---

## 12. Date & time formatting

Handled in code via locale, never hardcoded.

| | Norwegian (`nb-NO`) | English (`en-GB`) |
|---|---|---|
| Date | 4. juli 2026 | 4 July 2026 |
| Short date | 04.07.2026 | 04/07/2026 |
| Time | 09:00 | 09:00 |
| Time range | 09:00–17:00 (en dash, no spaces) | 09:00–17:00 |
| Weekday | mandag (lowercase mid-sentence) | Monday |

Use `toLocaleDateString("nb-NO")` / `toLocaleDateString("en-GB")` — this is already the codebase convention. 24-hour clock in both languages.

---

## 13. Address formatting

Norwegian postal convention, identical display in both languages:

```
Karl Johans gate 1
0154 Oslo
```

- Street + number on line one; postcode + city on line two.
- Postcode is four digits, never abbreviated.
- Inline form: «Karl Johans gate 1, 0154 Oslo».
- Country is omitted domestically; "Norway"/«Norge» only in international contexts (metadata, SEO).

---

## 14. Phone number formatting

- Always display with country code: `+47`.
- Mobile numbers grouped 3-2-3: `+47 412 34 567`.
- Landline numbers grouped 2-2-2-2: `+47 22 12 34 56`.
- `tel:` links strip spaces: `tel:+4741234567`.
- Never use leading zeros or `00 47`.

---

## Appendix: quality checklist before shipping any text

- [ ] Exists in both `en.json` and `no.json` with identical key paths
- [ ] Sentence case
- [ ] Matches an approved term in `terminology.md`
- [ ] No mixed language on the rendered page
- [ ] Error/success/empty states follow their formulas
- [ ] A native speaker would not flinch
