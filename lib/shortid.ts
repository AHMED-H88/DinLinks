import { randomInt } from "crypto";

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
  // crypto.randomInt is cryptographically secure and unbiased by contract.
  let out = "";
  for (let i = 0; i < SHORT_ID_LENGTH; i++) {
    out += SHORT_ID_ALPHABET[randomInt(SHORT_ID_ALPHABET.length)];
  }
  return out;
}
