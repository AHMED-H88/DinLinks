import { test } from "node:test";
import assert from "node:assert/strict";
import { safeJsonLdString } from "../lib/jsonld";

test("escapes </script> so a value cannot close the JSON-LD script element", () => {
  const out = safeJsonLdString({
    name: 'Evil AS</script><script>alert("x")</script>',
  });
  assert.ok(!out.includes("</script>"), "serialized output must not contain a script close tag");
  assert.ok(!out.includes("<"), "serialized output must not contain any raw <");
});

test("escaped output parses back to the identical value", () => {
  const value = {
    name: "Rør & Bad AS </script>",
    description: "a < b > c",
    nested: { list: ["<", "</ScRiPt>"] },
  };
  assert.deepEqual(JSON.parse(safeJsonLdString(value)), value);
});

test("ordinary JSON-LD payloads are unchanged", () => {
  const value = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Stenerud Rørservice",
    url: "https://www.dinlinks.com/no/business/abc",
  };
  assert.equal(safeJsonLdString(value), JSON.stringify(value));
});
