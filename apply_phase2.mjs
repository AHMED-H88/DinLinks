#!/usr/bin/env node
/**
 * apply_phase2.mjs
 * Run from the project root: node apply_phase2.mjs
 *
 * Applies Phase 2 translation changes:
 *   1. Copies *.new component files over the originals
 *   2. Transforms app/[locale]/business/[id]/page.tsx in place
 *   3. Copies messages/no.json.new → messages/no.json (if .new exists)
 *   4. Removes diagnostic/test files created during Phase 1/2 work
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));

// ──────────────────────────────────────────────────────────────────────────────
// 1. Copy .new component files
// ──────────────────────────────────────────────────────────────────────────────
const COMPONENT_PAIRS = [
  ["components/ReviewForm.tsx.new",       "components/ReviewForm.tsx"],
  ["components/ReviewList.tsx.new",       "components/ReviewList.tsx"],
  ["components/BranchesSection.tsx.new",  "components/BranchesSection.tsx"],
  ["components/ProfileGallery.tsx.new",   "components/ProfileGallery.tsx"],
];

for (const [src, dst] of COMPONENT_PAIRS) {
  const srcPath = join(ROOT, src);
  const dstPath = join(ROOT, dst);
  if (!existsSync(srcPath)) {
    console.error(`  ✗ MISSING: ${src}`);
    process.exit(1);
  }
  copyFileSync(srcPath, dstPath);
  console.log(`  ✓ ${dst}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Copy messages/no.json.new → messages/no.json
// ──────────────────────────────────────────────────────────────────────────────
const noNew = join(ROOT, "messages/no.json.new");
const noDst = join(ROOT, "messages/no.json");
if (existsSync(noNew)) {
  copyFileSync(noNew, noDst);
  console.log("  ✓ messages/no.json");
} else {
  console.warn("  ⚠ messages/no.json.new not found – skipping no.json copy");
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Transform app/[locale]/business/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
const PAGE_PATH = join(ROOT, "app/[locale]/business/[id]/page.tsx");

if (!existsSync(PAGE_PATH)) {
  console.error(`  ✗ MISSING: app/[locale]/business/[id]/page.tsx`);
  process.exit(1);
}

let src = readFileSync(PAGE_PATH, "utf8");
const original = src;

// ── 3a. Add getTranslations import (after existing next-intl import or at top) ──
if (!src.includes("getTranslations")) {
  if (src.includes("next-intl")) {
    // e.g. import { useTranslations } from "next-intl"  →  add server import
    src = src.replace(
      /from ['"]next-intl['"]/,
      `from "next-intl/server";\nimport { getTranslations } from "next-intl/server"`
    );
    // De-dup if already importing from next-intl/server
  } else {
    // Prepend after the last regular import block
    src = `import { getTranslations } from "next-intl/server";\n` + src;
  }
  // Simpler / more reliable: just add it before the first export
  // Re-do: reset and do a single clean injection
  src = original; // reset

  // Insert after "use server" / last import that already exists
  // Strategy: insert after the last `import` line before any `export` or `const`
  const lines = src.split("\n");
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImportIdx = i;
  }
  if (lastImportIdx === -1) lastImportIdx = 0;
  const alreadyHas = lines.some(l => l.includes("getTranslations"));
  if (!alreadyHas) {
    lines.splice(lastImportIdx + 1, 0, `import { getTranslations } from "next-intl/server";`);
  }
  src = lines.join("\n");
}

// ── 3b. Remove DAYS_EN and DAYS_NO constant blocks ──
// These look like:
//   const DAYS_EN: Record<string, string> = { ... };
//   const DAYS_NO: Record<string, string> = { ... };
// They are multi-line objects. We'll remove them.
src = src.replace(
  /\n?const DAYS_EN[\s\S]*?\};\n?/,
  "\n"
);
src = src.replace(
  /\n?const DAYS_NO[\s\S]*?\};\n?/,
  "\n"
);

// ── 3c. In generateMetadata: add getTranslations call ──
// Insert `const t = await getTranslations({ locale, namespace: "profile" });`
// right before the first `isNo` reference inside generateMetadata
src = src.replace(
  /(async function generateMetadata[\s\S]*?)(const isNo\s*=\s*locale\s*===\s*["']no["'])/,
  (_, before, isNoLine) => {
    const indent = isNoLine.match(/^(\s*)/)?.[1] ?? "  ";
    return `${before}${indent}const t = await getTranslations({ locale, namespace: "profile" });\n  ${isNoLine}`;
  }
);

// ── 3d. Replace generateMetadata isNo ternaries ──
// title: isNo ? "X" : "Y"  →  t("meta.notFound") etc.
// We replace the known patterns based on what the summary told us.

// title for not-found page
src = src.replace(
  /title:\s*isNo\s*\?\s*["'][^"']*ikke funnet[^"']*["']\s*:\s*["'][^"']*not found[^"']*["']/gi,
  `title: t("meta.notFound")`
);

// Description fallback with business name interpolation
// Pattern: isNo ? `${business.name} er en verifisert bedrift...` : `${business.name} is a verified business...`
// or using template literals / string concatenation
src = src.replace(
  /isNo\s*\?\s*`\$\{business\.name\}[^`]*er en verifisert bedrift[^`]*`\s*:\s*`\$\{business\.name\}[^`]*is a verified business[^`]*`/g,
  `t("meta.descriptionFallback", { name: business.name })`
);
// Same but with string concat using + instead of template literal
src = src.replace(
  /isNo\s*\?\s*["'][^"']*er en verifisert bedrift[^"']*["']\s*:\s*["'][^"']*is a verified business[^"']*["']/g,
  `t("meta.descriptionFallback", { name: business.name })`
);

// meta category fallback
src = src.replace(
  /isNo\s*\?\s*["']Bedrift["']\s*:\s*["']Business["']/g,
  `t("meta.categoryFallback")`
);

// meta location fallback
src = src.replace(
  /isNo\s*\?\s*["']Norge["']\s*:\s*["']Norway["']/g,
  `t("meta.locationFallback")`
);

// ── 3e. In BusinessProfilePage: add t and remove isNo / DAY_LABELS pattern ──
// Add getTranslations call
src = src.replace(
  /(export default async function BusinessProfilePage[\s\S]*?)(const isNo\s*=\s*locale\s*===\s*["']no["'])/,
  (_, before, isNoLine) => {
    const indent = isNoLine.match(/^(\s*)/)?.[1] ?? "  ";
    return `${before}${indent}const t = await getTranslations({ locale, namespace: "profile" });\n  ${isNoLine}`;
  }
);

// Remove old DAY_LABELS assignment (const DAY_LABELS = isNo ? DAYS_NO : DAYS_EN;)
src = src.replace(
  /\n?\s*const DAY_LABELS\s*=\s*isNo\s*\?\s*DAYS_NO\s*:\s*DAYS_EN\s*;\n?/,
  "\n"
);

// Add new DAY_LABELS built from t() — insert after dateLocale
// First ensure dateLocale exists
if (!src.includes("dateLocale")) {
  src = src.replace(
    /const isNo\s*=\s*locale\s*===\s*["']no["'];/,
    (m) => `${m}\n  const dateLocale = locale === "no" ? "nb-NO" : "en-GB";`
  );
}

// Add DAY_LABELS from t() right after dateLocale line (only once — before the first use in JSX)
const dayLabelsBlock = `
  const DAY_LABELS: Record<string, string> = {
    monday:    t("days.monday"),
    tuesday:   t("days.tuesday"),
    wednesday: t("days.wednesday"),
    thursday:  t("days.thursday"),
    friday:    t("days.friday"),
    saturday:  t("days.saturday"),
    sunday:    t("days.sunday"),
  };`;

if (!src.includes(`t("days.monday")`)) {
  // Insert after dateLocale line
  src = src.replace(
    /(const dateLocale\s*=\s*locale\s*===\s*["']no["'][^;]*;)/,
    (m) => `${m}${dayLabelsBlock}`
  );
}

// ── 3f. Replace inline isNo ternaries in JSX / logic ──

// Verified badge
src = src.replace(/isNo\s*\?\s*["']Verifisert["']\s*:\s*["']Verified["']/g,    `t("hero.verified")`);
// Open now
src = src.replace(/isNo\s*\?\s*["']Åpent nå["']\s*:\s*["']Open now["']/g,      `t("hero.openNow")`);
// Closed now
src = src.replace(/isNo\s*\?\s*["']Stengt nå["']\s*:\s*["']Closed now["']/g,   `t("hero.closedNow")`);
// branch / filial (singular)
src = src.replace(/isNo\s*\?\s*["']filial["']\s*:\s*["']branch["']/g,          `t("hero.branchSingular")`);
// branches / filialer (plural)
src = src.replace(/isNo\s*\?\s*["']filialer["']\s*:\s*["']branches["']/g,      `t("hero.branchPlural")`);

// Book now
src = src.replace(/isNo\s*\?\s*["']Book nå["']\s*:\s*["']Book now["']/g,       `t("actions.bookNow")`);
// Call
src = src.replace(/isNo\s*\?\s*["']Ring["']\s*:\s*["']Call["']/g,              `t("actions.call")`);
// Website (actions)
src = src.replace(/isNo\s*\?\s*["']Nettsted["']\s*:\s*["']Website["']/g,       `t("actions.website")`);
// Directions
src = src.replace(/isNo\s*\?\s*["']Veibeskrivelse["']\s*:\s*["']Directions["']/g, `t("actions.directions")`);
// Share
src = src.replace(/isNo\s*\?\s*["']Del["']\s*:\s*["']Share["']/g,              `t("actions.share")`);
// Copied!
src = src.replace(/isNo\s*\?\s*["']Kopiert!["']\s*:\s*["']Copied!["']/g,       `t("actions.copied")`);

// Section headings
src = src.replace(/isNo\s*\?\s*["']Om bedriften["']\s*:\s*["']About["']/g,     `t("sections.about")`);
src = src.replace(/isNo\s*\?\s*["']Tjenester["']\s*:\s*["']Services["']/g,     `t("sections.services")`);
src = src.replace(/isNo\s*\?\s*["']Anmeldelser["']\s*:\s*["']Reviews["']/g,    `t("sections.reviews")`);
src = src.replace(/isNo\s*\?\s*["']Lignende bedrifter["']\s*:\s*["']Similar businesses["']/g, `t("sections.similar")`);

// About section empty state
src = src.replace(/isNo\s*\?\s*["']Ingen beskrivelse lagt til ennå\.["']\s*:\s*["']No description provided yet\.["']/g, `t("about.empty")`);

// Reviews section
src = src.replace(/isNo\s*\?\s*["']Logg inn["']\s*:\s*["']Sign in["']/g,                          `t("reviews.signIn")`);
src = src.replace(/isNo\s*\?\s*["']for å skrive en anmeldelse\.["']\s*:\s*["']to leave a review\.["']/g, `t("reviews.signInToReview")`);
src = src.replace(/isNo\s*\?\s*["']Ingen anmeldelser ennå["']\s*:\s*["']No reviews yet["']/g,     `t("reviews.noReviews")`);
src = src.replace(/isNo\s*\?\s*["']Vær den første[^"']*["']\s*:\s*["']Be the first[^"']*["']/g,   `t("reviews.beFirst")`);
src = src.replace(/isNo\s*\?\s*["']anmeldelser["']\s*:\s*["']reviews["']/g,                       `t("reviews.reviewPlural")`);
src = src.replace(/isNo\s*\?\s*["']anmeldelse["']\s*:\s*["']review["']/g,                         `t("reviews.reviewSingular")`);

// Sidebar
src = src.replace(/isNo\s*\?\s*["']Kontakt["']\s*:\s*["']Contact["']/g,                  `t("sidebar.contact")`);
src = src.replace(/isNo\s*\?\s*["']Telefon["']\s*:\s*["']Phone["']/g,                    `t("sidebar.phone")`);
src = src.replace(/isNo\s*\?\s*["']E-post["']\s*:\s*["']Email["']/g,                     `t("sidebar.email")`);
src = src.replace(/isNo\s*\?\s*["']Besøk nettsted["']\s*:\s*["']Visit website["']/g,     `t("sidebar.visitWebsite")`);
src = src.replace(/isNo\s*\?\s*["']Åpningstider["']\s*:\s*["']Opening hours["']/g,       `t("sidebar.openingHours")`);
src = src.replace(/isNo\s*\?\s*["']Åpent["']\s*:\s*["']Open["']/g,                      `t("sidebar.open")`);
src = src.replace(/isNo\s*\?\s*["']Stengt["']\s*:\s*["']Closed["']/g,                   `t("sidebar.closed")`);
src = src.replace(/isNo\s*\?\s*["']Beliggenhet["']\s*:\s*["']Location["']/g,             `t("sidebar.location")`);
src = src.replace(/isNo\s*\?\s*["']Åpne i kart["']\s*:\s*["']Open in Maps["']/g,        `t("sidebar.openInMaps")`);
src = src.replace(/isNo\s*\?\s*["']Om denne profilen["']\s*:\s*["']Profile info["']/g,   `t("sidebar.profileInfo")`);
src = src.replace(/isNo\s*\?\s*["']Verifisert bedrift["']\s*:\s*["']Verified business["']/g, `t("sidebar.verifiedBusiness")`);
src = src.replace(/isNo\s*\?\s*["']Godkjent av DinLinks["']\s*:\s*["']Approved by DinLinks["']/g, `t("sidebar.approvedBy")`);
src = src.replace(/isNo\s*\?\s*["']Ekte kundevurderinger["']\s*:\s*["']Genuine customer ratings["']/g, `t("sidebar.genuineRatings")`);
src = src.replace(/isNo\s*\?\s*["']Profilvisninger["']\s*:\s*["']Profile views["']/g,    `t("sidebar.profileViews")`);
src = src.replace(/isNo\s*\?\s*["']Sist oppdatert["']\s*:\s*["']Last updated["']/g,      `t("sidebar.lastUpdated")`);

// sidebar.bookNow — different from actions.bookNow context (same value but may appear twice)
// the second occurrence is sidebar — both map to same key so both replacements above will have caught them

// Day labels for inline use (opening hours table in sidebar)
src = src.replace(/isNo\s*\?\s*["']Mandag["']\s*:\s*["']Monday["']/g,    `t("days.monday")`);
src = src.replace(/isNo\s*\?\s*["']Tirsdag["']\s*:\s*["']Tuesday["']/g,  `t("days.tuesday")`);
src = src.replace(/isNo\s*\?\s*["']Onsdag["']\s*:\s*["']Wednesday["']/g, `t("days.wednesday")`);
src = src.replace(/isNo\s*\?\s*["']Torsdag["']\s*:\s*["']Thursday["']/g, `t("days.thursday")`);
src = src.replace(/isNo\s*\?\s*["']Fredag["']\s*:\s*["']Friday["']/g,    `t("days.friday")`);
src = src.replace(/isNo\s*\?\s*["']Lørdag["']\s*:\s*["']Saturday["']/g,  `t("days.saturday")`);
src = src.replace(/isNo\s*\?\s*["']Søndag["']\s*:\s*["']Sunday["']/g,    `t("days.sunday")`);

// "in" preposition for meta (e.g. "Business in Norway")
src = src.replace(/isNo\s*\?\s*["']i["']\s*:\s*["']in["']/g, `t("meta.inPreposition")`);

// ── 3g. Remove locale prop from <ReviewForm> ──
src = src.replace(
  /<ReviewForm\s+([^>]*?)locale\s*=\s*\{locale\}\s*([^>]*?)>/g,
  (_, before, after) => `<ReviewForm ${(before + after).trim()}>`
);
// Clean up double spaces
src = src.replace(/<ReviewForm\s{2,}/g, "<ReviewForm ");

// ── 3h. Remove label props from <ProfileGallery> ──
src = src.replace(/\s*labelPhotos\s*=\s*\{[^}]*\}/g, "");
src = src.replace(/\s*labelClose\s*=\s*\{[^}]*\}/g, "");
src = src.replace(/\s*labelPrev\s*=\s*\{[^}]*\}/g, "");
src = src.replace(/\s*labelNext\s*=\s*\{[^}]*\}/g, "");

// ── 3i. Write the patched file ──
if (src === original) {
  console.warn("  ⚠ page.tsx: no changes were made — check that patterns matched");
} else {
  writeFileSync(PAGE_PATH, src, "utf8");
  console.log("  ✓ app/[locale]/business/[id]/page.tsx");
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Remove diagnostic/test files
// ──────────────────────────────────────────────────────────────────────────────
const CLEANUP = [
  "messages/test_write.json",
  "messages/swift_test.json",
  "components/_test.txt",
  "app/[locale]/business/[id]/_test.txt",
];

for (const f of CLEANUP) {
  const p = join(ROOT, f);
  if (existsSync(p)) {
    unlinkSync(p);
    console.log(`  🗑 removed ${f}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Done
// ──────────────────────────────────────────────────────────────────────────────
console.log("\n✅ Phase 2 applied. Next steps:");
console.log("   npm run build");
console.log("   npx tsc --noEmit");
console.log("\nIf any isNo ternary was NOT replaced (the script prints a warning),");
console.log("search page.tsx for remaining `isNo` occurrences and replace manually.");
