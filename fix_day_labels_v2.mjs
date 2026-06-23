#!/usr/bin/env node
/**
 * fix_day_labels_v2.mjs
 *
 * Removes any misplaced DAY_LABELS block (e.g. inserted inside generateMetadata)
 * and re-inserts it in the correct scope: inside BusinessProfilePage,
 * right after "const t = await getTranslations(...)".
 *
 * Safe to run on the already-patched page.tsx.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join } from "path";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PAGE = join(ROOT, "app/[locale]/business/[id]/page.tsx");

let src = readFileSync(PAGE, "utf8");

// ── Step 1: remove ALL existing DAY_LABELS blocks wherever they are ──────────
// Matches: const DAY_LABELS: Record<string, string> = { ... };  (multi-line)
src = src.replace(
  /\n[ \t]*const DAY_LABELS[\s\S]*?\};\n/g,
  "\n"
);

// ── Step 2: locate BusinessProfilePage function ───────────────────────────────
const BPP_MARKER = "export default async function BusinessProfilePage";
const bppIdx = src.indexOf(BPP_MARKER);
if (bppIdx === -1) {
  console.error("✗ Could not find BusinessProfilePage in page.tsx");
  process.exit(1);
}

// ── Step 3: find const t = await getTranslations AFTER BusinessProfilePage ────
const GT_MARKER = "await getTranslations(";
let searchFrom = bppIdx;
let gtIdx = src.indexOf(GT_MARKER, searchFrom);
if (gtIdx === -1) {
  console.error("✗ Could not find getTranslations call inside BusinessProfilePage");
  process.exit(1);
}

// Find the end of that statement's line
const lineEnd = src.indexOf("\n", gtIdx);
if (lineEnd === -1) {
  console.error("✗ Unexpected end of file after getTranslations");
  process.exit(1);
}

// ── Step 4: insert DAY_LABELS after that line ─────────────────────────────────
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

src = src.slice(0, lineEnd + 1) + DAY_LABELS_BLOCK + "\n" + src.slice(lineEnd + 1);

// ── Step 5: write ─────────────────────────────────────────────────────────────
writeFileSync(PAGE, src, "utf8");
console.log("✓ DAY_LABELS inserted inside BusinessProfilePage.");
console.log("  Now run: npm run build");
