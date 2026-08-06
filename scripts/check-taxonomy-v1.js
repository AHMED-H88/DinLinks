/**
 * check:taxonomy-v1
 *
 * Validates lib/taxonomy-v1.ts against the Taxonomy Master List v1.1 invariants.
 * Pure/static — never connects to a database. Run via tsx (see package.json).
 *
 * Exits 0 when the configuration is valid, 1 otherwise.
 */
import {
  TOP_LEVELS,
  SUBCATEGORIES,
  validateTaxonomyConfig,
  subcategoriesOf,
} from "../lib/taxonomy-v1";

const errors = validateTaxonomyConfig();

// A couple of extra structural assertions beyond the pure config validator.
if (TOP_LEVELS.length !== 8) errors.push(`Expected 8 top-level Categories, found ${TOP_LEVELS.length}.`);
for (const top of TOP_LEVELS) {
  if (subcategoriesOf(top.slug).length === 0) {
    errors.push(`Top-level "${top.slug}" has no subcategories.`);
  }
}

if (errors.length > 0) {
  console.error("check:taxonomy-v1 — configuration is INVALID:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("check:taxonomy-v1 — OK.");
console.log(
  `  ${TOP_LEVELS.length} top-level Categories, ${SUBCATEGORIES.length} Subcategories, two levels, ` +
    "no annet/generelt, Mat/Kafe(cafe)/Shopping confirmed."
);
