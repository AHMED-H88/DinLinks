/**
 * UUID v4 generation that works outside secure contexts.
 *
 * `crypto.randomUUID()` is flagged [SecureContext] in the Web Crypto spec, so
 * browsers only expose it on https:// and localhost. A phone opening the dev
 * server over the LAN (http://192.168.x.x) therefore gets `undefined`, and
 * calling it throws "crypto.randomUUID is not a function". When that happens
 * during component initialisation it takes the page down before first render.
 *
 * `crypto.getRandomValues()` carries no secure-context restriction and is
 * available on every browser this project supports, so it is the real fallback
 * and keeps the output cryptographically random.
 */

/** Format 16 random bytes as a canonical RFC 4122 version 4 UUID. */
function uuidFromBytes(bytes: Uint8Array): string {
  // RFC 4122 §4.4: version 4 in the high nibble of octet 6, and the variant
  // bits set to 0b10 in the two high bits of octet 8.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

/**
 * A canonical v4 UUID, e.g. "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed".
 *
 * Prefers the native implementation, falls back to getRandomValues, and only
 * as a last resort uses Math.random. That final tier is not cryptographically
 * random, but it is reachable solely on browsers lacking getRandomValues
 * entirely — and degrading there beats crashing the editor outright, which is
 * the failure this helper exists to prevent.
 */
export function uuidv4(): string {
  const webCrypto = globalThis.crypto as Crypto | undefined;

  if (typeof webCrypto?.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (typeof webCrypto?.getRandomValues === "function") {
    return uuidFromBytes(webCrypto.getRandomValues(new Uint8Array(16)));
  }

  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return uuidFromBytes(bytes);
}

/**
 * The hyphen-free 32-character form used as the storage folder for a business
 * that has not been saved yet. The upload API treats this as the first segment
 * of the storage path, so the shape must stay exactly as it was.
 */
export function uuidHex(): string {
  return uuidv4().replace(/-/g, "");
}
