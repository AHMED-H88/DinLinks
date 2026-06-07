import "server-only";
import { createClient } from "@supabase/supabase-js";

// ─── Client (service role — never exposed to browser) ────────────────────────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type StorageBucket = "logos" | "images";

export interface UploadResult {
  url: string;
  path: string;
  bucket: StorageBucket;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_SIZE_BYTES: Record<StorageBucket, number> = {
  logos: 2 * 1024 * 1024,   // 2 MB
  images: 5 * 1024 * 1024,  // 5 MB
};

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png":  "png",
    "image/webp": "webp",
  };
  return map[mimeType] ?? "jpg";
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Upload a file to the given Supabase Storage bucket.
 * Returns the public CDN URL and the storage path.
 *
 * Path convention:  {businessId}/{timestamp}.{ext}
 */
export async function uploadToStorage(
  file: File,
  bucket: StorageBucket,
  businessId: string
): Promise<UploadResult> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES[bucket]) {
    const maxMB = MAX_SIZE_BYTES[bucket] / (1024 * 1024);
    throw new Error(`File too large. Maximum size for ${bucket}: ${maxMB} MB`);
  }

  const supabase  = getServiceClient();
  const ext       = getExtension(file.type);
  const timestamp = Date.now();
  const path      = `${businessId}/${timestamp}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,       // overwrite if same path (re-upload same timestamp unlikely but safe)
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    url:    publicUrlData.publicUrl,
    path,
    bucket,
  };
}

/**
 * Delete a file from Supabase Storage by its path.
 * Silently succeeds if the file does not exist.
 */
export async function deleteFromStorage(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    // Log but don't throw — a missing file is not a fatal error
    console.error(`Supabase Storage delete failed (${bucket}/${path}):`, error.message);
  }
}

/**
 * Extract the storage path from a full Supabase public URL.
 * Used when deleting an existing file before replacing it.
 *
 * Input:  https://<ref>.supabase.co/storage/v1/object/public/logos/abc/123.jpg
 * Output: abc/123.jpg
 */
export function extractStoragePath(
  publicUrl: string,
  bucket: StorageBucket
): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx    = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
