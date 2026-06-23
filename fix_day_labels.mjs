#!/usr/bin/env node
/**
 * fix_day_labels.mjs
 * Targeted fix: inserts the DAY_LABELS constant (built from t() calls)
 * into BusinessProfilePage, right after the getTranslations call.
 * Safe to run once on the already-patched page.tsx.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join } from "path";

const ROOT     = fileURLToPath(new URL(".", import.meta.url));
const PAGE     = join(ROOT, "app/[locale]/business/[id]/page.tsx");

let src = readFileSync(PAGE, "utf8");

if (src.includes('t("days.monday")')) {
  console.log("✓ DAY_LABELS already present — nothing to do.");
  process.exit(0);
}

// The block to insert
const DAY_LABELS_BLOCK = `
  const DAY_LABELS: Record<string, string> = {
    monday:    t("days.monday"),
    tuesday:   t("days.tuesday"),
    wednesday: t("days.wednesday"),
    thursday:  t("days.thursday"),
    friday:    t("days.friday"),
    saturday:  t("days.saturday"),
    sunday:    t("days.sunday"),
  };`;

// Strategy: find the getTranslations call inside BusinessProfilePage
// (not generateMetadata — we want the second occurrence).
// Pattern: look for the second `await getTranslations({ locale, namespace: "profile" })`
// and insert DAY_LABELS after the line that contains it.

const marker = `await getTranslations({ locale, namespace: "profile" })`;
const firstIdx  = src.indexOf(marker);
const secondIdx = src.indexOf(marker, firstIdx + 1);

if (secondIdx === -1) {
  // Only one occurrence — it's in BusinessProfilePage (generateMetadata uses different var or no profile ns)
  // Try inserting after the only occurrence
  console.warn("Only one getTranslations call found — inserting after it.");
}

const insertAfterIdx = secondIdx !== -1 ? secondIdx : firstIdx;

if (insertAfterIdx === -1) {
  console.error("✗ Could not locate getTranslations call in page.tsx.");
  console.error("  Please add this block manually inside BusinessProfilePage, after the const t = ... line:");
  console.error(DAY_LABELS_BLOCK);
  process.exit(1);
}

// Find the end of that line
const lineEnd = src.indexOf("\n", insertAfterIdx);
if (lineEnd === -1) {
  console.error("✗ Could not find line end after getTranslations call.");
  process.exit(1);
}

// Insert DAY_LABELS after that line
const patched = src.slice(0, lineEnd + 1) + DAY_LABELS_BLOCK + "\n" + src.slice(lineEnd + 1);

writeFileSync(PAGE, patched, "utf8");
console.log("✓ DAY_LABELS inserted into page.tsx.");
console.log("  Now run: npm run build");
