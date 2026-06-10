import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Shared field picker ──────────────────────────────────────────────────────

function pickFields(data: any) {
  return {
    name:         data.name         ?? null,
    description:  data.description  ?? null,
    categoryId:   data.categoryId   ?? null,
    logo:         data.logo         ?? null,
    coverImage:   data.coverImage   ?? null,
    images:       Array.isArray(data.images) ? data.images : [],
    services:     Array.isArray(data.services) ? data.services : [],
    address:      data.address      ?? null,
    city:         data.city         ?? null,
    postalCode:   data.postalCode   ?? null,
    latitude:     typeof data.latitude  === "number" ? data.latitude  : null,
    longitude:    typeof data.longitude === "number" ? data.longitude : null,
    phone:        data.phone        ?? null,
    email:        data.email        ?? null,
    website:      data.website      ?? null,
    bookingLink:  data.bookingLink  ?? null,
    mapLink:      data.mapLink      ?? null,
    openingHours: data.openingHours ?? null,
  };
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

    const data     = await req.json();
    const business = await prisma.business.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        ...pickFields(data),
      },
    });

    return NextResponse.json(business, { status: 201 });
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

    // If the business was REJECTED and the owner updates it → back to PENDING
    const statusUpdate =
      existing.status === "REJECTED" ? { status: "PENDING" as const } : {};

    const business = await prisma.business.update({
      where: { userId: session.user.id },
      data: {
        ...pickFields(data),
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
