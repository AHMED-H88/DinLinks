import { randomBytes } from "crypto";

/**
 * The public URL identity key for a business: exactly 10 lowercase
 * alphanumeric characters, immutable after creation.
 *
 * Kept separate from the cuid primary key so the URL identity carries no
 * structure and encodes no mutable business information. 36^10 ≈ 3.6e15
 * values; the database unique constraint is the real guarantee — creation
 * retries on the (practically unreachable) collision.
 */
export const SHORT_ID_LENGTH = 10;
export const SHORT_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateBusinessShortId(): string {
  const out: string[] = [];
  while (out.length < SHORT_ID_LENGTH) {
    // Rejection sampling: 252 is the largest multiple of 36 below 256, so
    // taking bytes < 252 modulo 36 keeps every character equally likely.
    for (const byte of randomBytes(SHORT_ID_LENGTH)) {
      if (byte < 252) {
        out.push(SHORT_ID_ALPHABET[byte % 36]);
        if (out.length === SHORT_ID_LENGTH) break;
      }
    }
  }
  return out.join("");
}
