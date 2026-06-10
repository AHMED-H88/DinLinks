import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to leave a review." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { businessId, rating, comment } = parsed.data;

  // Verify the business exists and is approved
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, status: true },
  });

  if (!business || business.status !== "APPROVED") {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  // Prevent business owners from reviewing their own business
  const ownBusiness = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (ownBusiness?.id === businessId) {
    return NextResponse.json({ error: "You cannot review your own business." }, { status: 403 });
  }

  const authorName = session.user.name ?? session.user.email ?? "Anonymous";

  const review = await prisma.review.create({
    data: { businessId, authorName, rating, comment },
  });

  return NextResponse.json(review, { status: 201 });
}
