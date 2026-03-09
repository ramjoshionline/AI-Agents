import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/agents/[id]/reviews — create or update a review (buyer only, must have subscribed)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "buyer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rating =
    typeof body?.rating === "number" && Number.isInteger(body.rating)
      ? body.rating
      : 0;
  const comment =
    typeof body?.comment === "string" ? body.comment.trim().slice(0, 1000) : "";

  if (rating < 1 || rating > 5)
    return NextResponse.json({ error: "Rating must be an integer from 1 to 5" }, { status: 400 });

  // Buyer must have ever subscribed (any status)
  const hasSub = await prisma.subscription.findFirst({
    where: { agentId: params.id, buyerId: session.user.id },
  });
  if (!hasSub)
    return NextResponse.json(
      { error: "You must subscribe before reviewing" },
      { status: 403 }
    );

  const review = await prisma.review.upsert({
    where: { agentId_buyerId: { agentId: params.id, buyerId: session.user.id } },
    create: { agentId: params.id, buyerId: session.user.id, rating, comment },
    update: { rating, comment },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      buyer: { select: { name: true } },
    },
  });

  return NextResponse.json(review);
}
