/**
 * Serialize an object for embedding inside a <script type="application/ld+json">
 * block via dangerouslySetInnerHTML.
 *
 * `JSON.stringify` alone is not safe there: it does not escape `<`, so a value
 * containing the text `</script>` closes the script element early and the rest
 * of the value is parsed as live HTML — a stored-XSS vector, since JSON-LD
 * fields like business name and description are owner-supplied. Escaping every
 * `<` as its JSON unicode escape keeps the payload byte-safe inside the script
 * element while remaining identical after JSON.parse.
 */
export function safeJsonLdString(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
