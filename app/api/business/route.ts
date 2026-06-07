import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const existingBusiness = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: "Business already exists" },
        { status: 400 }
      );
    }

    const business = await prisma.business.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        logo: data.logo,
        images: data.images,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        email: data.email,
        website: data.website,
        bookingLink: data.bookingLink,
        mapLink: data.mapLink,
        openingHours: data.openingHours,
        status: "PENDING",
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const business = await prisma.business.update({
      where: { userId: session.user.id },
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        logo: data.logo,
        images: data.images,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        email: data.email,
        website: data.website,
        bookingLink: data.bookingLink,
        mapLink: data.mapLink,
        openingHours: data.openingHours,
      },
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
