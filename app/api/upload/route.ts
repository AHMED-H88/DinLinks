import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  uploadToStorage,
  deleteFromStorage,
  extractStoragePath,
  getBucketFromUrl,
  type StorageBucket,
} from "@/lib/supabase-storage";

// ─── Shared auth helper ───────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

// ─── POST /api/upload — upload a file to Supabase Storage ────────────────────
//
// Body:    multipart/form-data
//   file       File     — the image to upload
//   bucket     string   — "logos" | "images"
//   businessId string   — owner's business ID (or temp UUID for new businesses)
//
// Returns: { url: string } on success

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse form ──────────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request — expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file       = formData.get("file");
  const bucket     = formData.get("bucket") as StorageBucket | null;
  const businessId = (formData.get("businessId") as string | null)?.trim();

  // ── Field validation ────────────────────────────────────────────────────────
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Missing field "file"' },
      { status: 400 }
    );
  }

  if (!bucket || !["logos", "images"].includes(bucket)) {
    return NextResponse.json(
      { error: 'Field "bucket" must be "logos" or "images"' },
      { status: 400 }
    );
  }

  if (!businessId) {
    return NextResponse.json(
      { error: 'Missing field "businessId"' },
      { status: 400 }
    );
  }

  // ── Ownership check ─────────────────────────────────────────────────────────
  // If a business with this ID already exists in the database, confirm the
  // session user owns it. If no record exists, it's a temp ID for a brand-new
  // business being created — allow it.
  const existingBusiness = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { userId: true },
  });

  if (existingBusiness && existingBusiness.userId !== user.id) {
    return NextResponse.json(
      { error: "Forbidden — you do not own this business" },
      { status: 403 }
    );
  }

  // ── Upload (validation happens inside uploadToStorage) ──────────────────────
  try {
    const result = await uploadToStorage(file, bucket, businessId);
    return NextResponse.json({ url: result.url }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[POST /api/upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE /api/upload — delete a file from Supabase Storage ────────────────
//
// Body:    application/json
//   url    string   — the full public URL returned by a previous upload
//
// Security: the storage path encodes the businessId as its first segment.
// We verify the session user owns that business before deleting.
// For temp-ID paths (business not yet in DB), we allow the delete so users
// can clean up aborted uploads.

export async function DELETE(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: 'Missing field "url"' },
      { status: 400 }
    );
  }

  // ── Derive bucket from URL ──────────────────────────────────────────────────
  const bucket = getBucketFromUrl(url);
  if (!bucket) {
    return NextResponse.json(
      { error: "URL does not point to a known Supabase storage bucket" },
      { status: 400 }
    );
  }

  // ── Extract storage path ────────────────────────────────────────────────────
  const storagePath = extractStoragePath(url, bucket);
  if (!storagePath) {
    return NextResponse.json(
      { error: "Could not extract storage path from URL" },
      { status: 400 }
    );
  }

  // ── Ownership check ─────────────────────────────────────────────────────────
  // Path format: {businessId}/{timestamp}-{suffix}.{ext}
  // We extract businessId and verify the session user owns it.
  const businessId = storagePath.split("/")[0];

  if (businessId) {
    const business = await prisma.business.findUnique({
      where:  { id: businessId },
      select: { userId: true },
    });

    // If the business exists but doesn't belong to this user → reject
    if (business && business.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden — you do not own this business" },
        { status: 403 }
      );
    }
    // If business is null → temp ID, allow (user deleting their own upload)
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  try {
    await deleteFromStorage(bucket, storagePath);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    console.error("[DELETE /api/upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
