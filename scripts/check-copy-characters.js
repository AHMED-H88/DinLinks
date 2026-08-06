#!/usr/bin/env node
/**
 * check:copy-characters
 *
 * Enforces the DinLinks Character Standard (docs/12_LOCALIZATION_STANDARD.md)
 * for DinLinks-owned UI copy in the localization files.
 *
 * - Allows the Norwegian letters æ ø å (and Æ Ø Å).
 * - Rejects any other accented Latin LETTER (é è ê á à ó ò ü ñ ç …).
 * - Ignores non-letter symbols (e.g. the × dimension sign), punctuation, and
 *   the Norwegian letters above.
 * - Scans ONLY messages/no.json and messages/en.json. It never reads or
 *   rewrites business names, user-generated content, addresses, or external
 *   data, and it has no effect on application runtime.
 *
 * Exits 0 when clean, 1 when a disallowed character is found.
 */
const fs = require("fs");
const path = require("path");

const FILES = ["messages/no.json", "messages/en.json"];
const ALLOWED = new Set(["æ", "ø", "å", "Æ", "Ø", "Å"]);
const COMBINING = /\p{Mn}/u;

function isAccentedLatinLetter(ch) {
  if (ALLOWED.has(ch)) return false;
  const nfd = ch.normalize("NFD");
  // An accented Latin letter decomposes to a base ASCII letter + combining mark(s).
  // Symbols like × (U+00D7) do not decompose to a letter, so they are ignored.
  return nfd.length > 1 && /^[A-Za-z]/.test(nfd) && COMBINING.test(nfd.slice(1));
}

const violations = [];
for (const rel of FILES) {
  const abs = path.join(process.cwd(), rel);
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const ch of line) {
      if (isAccentedLatinLetter(ch)) {
        violations.push({
          file: rel,
          line: i + 1,
          char: ch,
          code: "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"),
          context: line.trim().slice(0, 80),
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("check:copy-characters — disallowed accented Latin characters found:\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.char} (${v.code})  | ${v.context}`);
  }
  console.error(
    `\n${violations.length} violation(s). Allowed: æ ø å (and Æ Ø Å). ` +
      "Use plain Latin forms in DinLinks-owned copy (e.g. Kafe not Kafé)."
  );
  process.exit(1);
}

console.log(
  "check:copy-characters — OK. No disallowed accented Latin characters in " +
    "messages/no.json, messages/en.json."
);
console.log("(Allowed: æ ø å Æ Ø Å. Non-letter symbols such as × are ignored.)");
