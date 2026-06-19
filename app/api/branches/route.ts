import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

/** Ensure the authenticated user owns the business with `businessId`. */
async function verifyOwnership(userId: string, businessId: string) {
  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { userId: true },
  });
  if (!business) return { ok: false, status: 404, error: "Business not found" } as const;
  if (business.userId !== userId)
    return { ok: false, status: 403, error: "Forbidden — you do not own this business" } as const;
  return { ok: true } as const;
}

// ─── GET /api/branches?businessId=xxx ────────────────────────────────────────
// Public: returns all branches for a business (ordered: main first, then by name)

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId)
    return NextResponse.json({ error: "Missing businessId query param" }, { status: 400 });

  const branches = await prisma.branch.findMany({
    where:   { businessId },
    orderBy: [{ isMainBranch: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(branches);
}

// ─── POST /api/branches ───────────────────────────────────────────────────────
// Auth-required: create a new branch for the authenticated user's business.
// If isMainBranch is true, demotes all other branches first.

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const businessId = (body.businessId as string | undefined)?.trim();
  if (!businessId)
    return NextResponse.json({ error: 'Missing field "businessId"' }, { status: 400 });

  const name = (body.name as string | undefined)?.trim();
  if (!name)
    return NextResponse.json({ error: 'Missing field "name"' }, { status: 400 });

  // Ownership check
  const ownership = await verifyOwnership(user.id, businessId);
  if (!ownership.ok)
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });

  const isMain = body.isMainBranch === true;

  // If this will be the main branch, demote all existing ones first
  if (isMain) {
    await prisma.branch.updateMany({
      where: { businessId },
      data:  { isMainBranch: false },
    });
  }

  const branch = await prisma.branch.create({
    data: {
      businessId,
      name,
      address:      (body.address      as string | undefined) ?? null,
      city:         (body.city         as string | undefined) ?? null,
      postalCode:   (body.postalCode   as string | undefined) ?? null,
      country:      (body.country      as string | undefined) ?? "NO",
      phone:        (body.phone        as string | undefined) ?? null,
      email:        (body.email        as string | undefined) ?? null,
      latitude:     typeof body.latitude  === "number" ? body.latitude  : null,
      longitude:    typeof body.longitude === "number" ? body.longitude : null,
      openingHours: body.openingHours === null || body.openingHours === undefined ? null : (body.openingHours as any),
      isMainBranch: isMain,
    },
  });

  return NextResponse.json(branch, { status: 201 });
}
