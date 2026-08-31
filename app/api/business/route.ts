import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateBusinessShortId } from "@/lib/shortid";
import { validateBusinessExtras } from "@/lib/business-fields";
import { validateSelectedSubcategory } from "@/lib/taxonomy-v1";

// ─── Shared field picker ──────────────────────────────────────────────────────

/**
 * Fields the editor always submits, so an absent key here genuinely means the
 * owner cleared it.
 *
 * `services` and `mapLink` are deliberately NOT in this list — both moved to
 * validateBusinessExtras, which writes a key only when the request carried it.
 * mapLink is no longer an editor field, and `?? null` would have wiped every
 * stored value the first time a form without it saved. services moved with it
 * so the owner-authored JSON is normalised on the way in rather than stored
 * verbatim.
 */
function pickFields(data: any) {
  return {
    name:         data.name         ?? null,
    description:  data.description  ?? null,
    categoryId:   data.categoryId   ?? null,
    logo:         data.logo         ?? null,
    coverImage:   data.coverImage   ?? null,
    images:       Array.isArray(data.images) ? data.images : [],
    address:      data.address      ?? null,
    city:         data.city         ?? null,
    postalCode:   data.postalCode   ?? null,
    latitude:     typeof data.latitude  === "number" ? data.latitude  : null,
    longitude:    typeof data.longitude === "number" ? data.longitude : null,
    phone:        data.phone        ?? null,
    email:        data.email        ?? null,
    website:      data.website      ?? null,
    bookingLink:  data.bookingLink  ?? null,
    openingHours: data.openingHours ?? null,
  };
}

// ─── Category (Subcategory) validation ───────────────────────────────────────
// Taxonomy v1: a business must be assigned to exactly one Subcategory — a
// category whose parent is a top-level Category (parentId = null). This never
// trusts the client; it verifies the hierarchy on the server.
async function validateCategorySelection(
  categoryId: unknown
): Promise<{ ok: true; categoryId: string } | { ok: false; code: string }> {
  if (typeof categoryId !== "string" || categoryId.length === 0) {
    return { ok: false, code: "missing" };
  }
  const cat = await prisma.category.findUnique({
    where: { id: categoryId },
    // Explicit select: the row plus its parent's slug + parentId, so the pure
    // canonical validator can verify slug, parent, and exact depth.
    select: {
      id: true,
      slug: true,
      parentId: true,
      parent: { select: { id: true, slug: true, parentId: true } },
    },
  });
  if (!cat) return { ok: false, code: "unknownSubcategory" };

  const code = validateSelectedSubcategory({
    slug: cat.slug,
    parentId: cat.parentId,
    parentSlug: cat.parent?.slug ?? null,
    parentParentId: cat.parent?.parentId ?? null,
  });
  if (code !== "ok") return { ok: false, code };
  return { ok: true, categoryId: cat.id };
}

// ─── POST /api/business — create ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // One business per owner
    const existing = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a business profile. Please edit it instead." },
        { status: 400 }
      );
    }

    const data = await req.json();

    // Step A1 fields — explicitly whitelisted, normalised and validated.
    const extras = validateBusinessExtras(data);
    if (!extras.ok) {
      return NextResponse.json(
        { error: "Validation failed", fields: extras.errors },
        { status: 400 }
      );
    }

    // Server-side taxonomy validation — must be a valid Subcategory.
    const catCheck = await validateCategorySelection(data.categoryId);
    if (!catCheck.ok) {
      return NextResponse.json({ error: "Invalid category selection.", code: catCheck.code, field: "categoryId" }, { status: 400 });
    }

    // shortId is the immutable public URL identity. Generated server-side only
    // (it is not in the pickFields whitelist, so a client can never set it) and
    // retried on the practically-unreachable unique-constraint collision. Any
    // other error — including the one-business-per-user userId collision —
    // rethrows unchanged to the handler's 500 path.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const business = await prisma.business.create({
          data: {
            userId: session.user.id,
            status: "PENDING",
            ...pickFields(data),
            ...extras.data,
            shortId: generateBusinessShortId(),
          },
        });
        return NextResponse.json(business, { status: 201 });
      } catch (err) {
        const isShortIdCollision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          String(err.meta?.target ?? "").includes("shortId");
        if (!isShortIdCollision) throw err;
      }
    }
    throw new Error("could not allocate a unique business shortId in 5 attempts");
  } catch (err) {
    console.error("[POST /api/business]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT /api/business — update ─────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Confirm this user owns the business (where clause already guarantees it)
    const existing = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "No business profile found. Please create one first." },
        { status: 404 }
      );
    }

    const data = await req.json();

    // Step A1 fields — explicitly whitelisted, normalised and validated.
    const extras = validateBusinessExtras(data);
    if (!extras.ok) {
      return NextResponse.json(
        { error: "Validation failed", fields: extras.errors },
        { status: 400 }
      );
    }

    // Server-side taxonomy validation — must be a valid Subcategory.
    const catCheck = await validateCategorySelection(data.categoryId);
    if (!catCheck.ok) {
      return NextResponse.json({ error: "Invalid category selection.", code: catCheck.code, field: "categoryId" }, { status: 400 });
    }

    // If the business was REJECTED and the owner updates it → back to PENDING
    const statusUpdate =
      existing.status === "REJECTED" ? { status: "PENDING" as const } : {};

    const business = await prisma.business.update({
      where: { userId: session.user.id },
      data: {
        ...pickFields(data),
        ...extras.data,
        ...statusUpdate,
      },
    });

    return NextResponse.json(business);
  } catch (err) {
    console.error("[PUT /api/business]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/business — fetch current user's business ──────────────────────

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where:   { userId: session.user.id },
      include: { category: true, subscription: true },
    });

    return NextResponse.json(business ?? null);
  } catch (err) {
    console.error("[GET /api/business]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
