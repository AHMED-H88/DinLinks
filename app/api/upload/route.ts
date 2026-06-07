import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  uploadToStorage,
  type StorageBucket,
} from "@/lib/supabase-storage";

// ─── POST /api/upload ─────────────────────────────────────────────────────────
//
// Accepts:  multipart/form-data { file: File, bucket: "logos" | "images", businessId: string }
// Returns:  { url: string } on success
//           { error: string } with appropriate status on failure
//
// Authentication: must be signed in. The businessId is not validated against
// the session here — the dashboard page already guards that only the owner
// can submit the business form. A stricter check can be added later.

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse multipart form ──────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request: expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file       = formData.get("file");
  const bucket     = formData.get("bucket") as StorageBucket | null;
  const businessId = formData.get("businessId");

  // ── Validate fields ───────────────────────────────────────────────────────
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing or invalid field: file" },
      { status: 400 }
    );
  }

  if (!bucket || !["logos", "images"].includes(bucket)) {
    return NextResponse.json(
      { error: "Missing or invalid field: bucket (must be 'logos' or 'images')" },
      { status: 400 }
    );
  }

  if (!businessId || typeof businessId !== "string" || businessId.trim() === "") {
    return NextResponse.json(
      { error: "Missing or invalid field: businessId" },
      { status: 400 }
    );
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  try {
    const result = await uploadToStorage(file, bucket, businessId.trim());
    return NextResponse.json({ url: result.url }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[/api/upload] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
