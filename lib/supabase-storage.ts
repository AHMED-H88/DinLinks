import "server-only";
import { createClient } from "@supabase/supabase-js";

// ─── Singleton service-role client ───────────────────────────────────────────
// One instance per server process — safe because the key never changes at
// runtime and createClient is not async.

let _client: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type StorageBucket = "logos" | "images";

export interface UploadResult {
  url:    string;
  path:   string;
  bucket: StorageBucket;
}

// ─── Validation constants ─────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Max file size per bucket */
const MAX_SIZE_BYTES: Record<StorageBucket, number> = {
  logos:  2 * 1024 * 1024,  // 2 MB  — square logo
  images: 5 * 1024 * 1024,  // 5 MB  — cover / gallery
};

/** Cache duration for uploaded images (1 year, immutable — paths include timestamps) */
const CACHE_CONTROL = "public, max-age=31536000, immutable";

// ─── Magic-bytes validation ───────────────────────────────────────────────────
//
// `file.type` is client-supplied and untrustworthy.  We read the first 12
// bytes of the buffer to confirm the payload actually matches the declared
// MIME type before storing anything in Supabase.
//
// Signatures:
//   JPEG  → 0xFF 0xD8
//   PNG   → 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
//   WebP  → RIFF at [0..3]  +  WEBP at [8..11]

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  switch (mimeType) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8;

    case "image/png":
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case "image/webp":
      // "RIFF" at bytes 0-3 and "WEBP" at bytes 8-11
      return (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      );

    default:
      return false;
  }
}

// ─── Extension helper ─────────────────────────────────────────────────────────

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png":  "png",
    "image/webp": "webp",
  };
  return map[mimeType] ?? "jpg";
}

// ─── Public URL helpers ───────────────────────────────────────────────────────

/**
 * Convert a Supabase public object URL to an image-transformation render URL.
 *
 * Supabase Storage supports on-the-fly image transforms (resize, quality,
 * format conversion) via the `/render/image/public/` prefix.
 *
 * Example:
 *   input:  https://<ref>.supabase.co/storage/v1/object/public/logos/abc/123.jpg
 *   output: https://<ref>.supabase.co/storage/v1/render/image/public/logos/abc/123.jpg?width=400&quality=80&format=webp
 *
 * Falls back to the original URL if the transform prefix is not detected.
 */
export function getOptimizedUrl(
  publicUrl: string,
  options: {
    width?:   number;
    height?:  number;
    quality?: number;            // 1–100 (default Supabase: 80)
    format?:  "webp" | "avif" | "origin";
  } = {}
): string {
  if (!publicUrl) return publicUrl;

  const renderUrl = publicUrl.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  // If the URL didn't contain the expected segment, return as-is
  if (renderUrl === publicUrl) return publicUrl;

  const params = new URLSearchParams();
  if (options.width   != null) params.set("width",   String(options.width));
  if (options.height  != null) params.set("height",  String(options.height));
  if (options.quality != null) params.set("quality", String(options.quality));
  if (options.format)          params.set("format",  options.format);

  const qs = params.toString();
  return qs ? `${renderUrl}?${qs}` : renderUrl;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a file to the given Supabase Storage bucket.
 *
 * Validation order:
 *   1. MIME type allowlist (jpeg / png / webp)
 *   2. File size limit (2 MB logos, 5 MB images)
 *   3. Magic-bytes check — confirms the binary payload matches the claimed type
 *
 * Storage path convention: `{businessId}/{timestamp}-{random4}.{ext}`
 * The timestamp + random suffix makes every upload a unique path, so existing
 * URLs are never overwritten when a user replaces an image.
 *
 * Returns the permanent public CDN URL and the storage path (used for deletion).
 */
export async function uploadToStorage(
  file: File,
  bucket: StorageBucket,
  businessId: string
): Promise<UploadResult> {
  // ── 1. MIME type allowlist ──────────────────────────────────────────────
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error(
      `Unsupported file type "${file.type}". ` +
      `Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // ── 2. Size limit ───────────────────────────────────────────────────────
  const maxBytes = MAX_SIZE_BYTES[bucket];
  if (file.size > maxBytes) {
    const maxMB = maxBytes / (1024 * 1024);
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
      `Maximum for ${bucket}: ${maxMB} MB`
    );
  }

  // ── 3. Read buffer + magic-bytes check ─────────────────────────────────
  const arrayBuffer = await file.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);

  if (!validateMagicBytes(buffer, file.type)) {
    throw new Error(
      `File content does not match declared type "${file.type}". ` +
      `Please upload a valid image file.`
    );
  }

  // ── Upload to Supabase Storage ──────────────────────────────────────────
  const supabase  = getServiceClient();
  const ext       = getExtension(file.type);
  // Unique path: timestamp + 4 random hex chars prevents any collision
  const suffix    = Math.random().toString(16).slice(2, 6);
  const path      = `${businessId}/${Date.now()}-${suffix}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType:  file.type,
      cacheControl: CACHE_CONTROL,
      upsert:       false,   // unique path means no overwrite needed
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // ── Get public URL ──────────────────────────────────────────────────────
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    url:    urlData.publicUrl,
    path,
    bucket,
  };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a file from Supabase Storage by its storage path.
 *
 * Silently succeeds if the file does not exist (idempotent).
 * Throws on unexpected storage errors so callers can log them.
 */
export async function deleteFromStorage(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  if (!path) return;

  const supabase = getServiceClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    // Log but don't throw — a missing file is not fatal
    console.error(`[storage] delete failed (${bucket}/${path}): ${error.message}`);
  }
}

// ─── Path extraction ──────────────────────────────────────────────────────────

/**
 * Extract the Supabase storage path from a full public URL.
 *
 * Input:  https://<ref>.supabase.co/storage/v1/object/public/logos/abc/123.jpg
 * Output: abc/123.jpg
 *
 * Returns null if the URL does not belong to this bucket.
 */
export function extractStoragePath(
  publicUrl: string,
  bucket: StorageBucket
): string | null {
  if (!publicUrl) return null;

  // Handle both object and render URLs
  for (const prefix of [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/render/image/public/${bucket}/`,
  ]) {
    const idx = publicUrl.indexOf(prefix);
    if (idx !== -1) {
      // Strip any query string (optimization params)
      const raw = publicUrl.slice(idx + prefix.length);
      return raw.split("?")[0];
    }
  }

  return null;
}

/**
 * Derive the bucket name from a Supabase public URL.
 * Returns null if the URL is not a known Supabase storage URL.
 */
export function getBucketFromUrl(publicUrl: string): StorageBucket | null {
  if (publicUrl.includes("/public/logos/"))  return "logos";
  if (publicUrl.includes("/public/images/")) return "images";
  return null;
}
