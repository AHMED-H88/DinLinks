import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

/** Load branch and confirm the session user owns its parent business. */
async function loadBranchWithOwnership(branchId: string, userId: string) {
  const branch = await prisma.branch.findUnique({
    where:   { id: branchId },
    include: { business: { select: { userId: true } } },
  });
  if (!branch) return { ok: false, status: 404, error: "Branch not found" } as const;
  if (branch.business.userId !== userId)
    return { ok: false, status: 403, error: "Forbidden — you do not own this business" } as const;
  return { ok: true, branch } as const;
}

// ─── PUT /api/branches/[id] ───────────────────────────────────────────────────
// Update a branch. If isMainBranch becomes true, all other branches are demoted.
// A business must keep at least one main branch — if this is the only branch and
// the caller tries to un-set isMainBranch we keep it as main.

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const loaded = await loadBranchWithOwnership(id, user.id);
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { branch } = loaded;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isMain = body.isMainBranch === true;

  // Demote other branches if this one becomes main
  if (isMain) {
    await prisma.branch.updateMany({
      where: { businessId: branch.businessId, NOT: { id } },
      data:  { isMainBranch: false },
    });
  }

  const updated = await prisma.branch.update({
    where: { id },
    data: {
      name:         typeof body.name        === "string" ? body.name.trim()        : undefined,
      address:      typeof body.address     === "string" ? body.address.trim()     : null,
      city:         typeof body.city        === "string" ? body.city.trim()        : null,
      postalCode:   typeof body.postalCode  === "string" ? body.postalCode.trim()  : null,
      country:      typeof body.country     === "string" ? body.country.trim()     : undefined,
      phone:        typeof body.phone       === "string" ? body.phone.trim()       : null,
      email:        typeof body.email       === "string" ? body.email.trim()       : null,
      latitude:     typeof body.latitude    === "number" ? body.latitude           : null,
      longitude:    typeof body.longitude   === "number" ? body.longitude          : null,
      openingHours: body.openingHours !== undefined
        ? (body.openingHours === null ? null : (body.openingHours as any))
        : undefined,
      isMainBranch: isMain,
    },
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/branches/[id] ────────────────────────────────────────────────
// Delete a branch. Refuses if it is the last (or only) branch of the business
// AND is marked as main — owner must designate another main first.

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const loaded = await loadBranchWithOwnership(id, user.id);
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { branch } = loaded;

  // Safety: refuse deleting the main branch if it is the only branch left
  if (branch.isMainBranch) {
    const count = await prisma.branch.count({ where: { businessId: branch.businessId } });
    if (count === 1) {
      return NextResponse.json(
        { error: "Cannot delete the only branch. Add another branch first." },
        { status: 409 }
      );
    }
  }

  await prisma.branch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
