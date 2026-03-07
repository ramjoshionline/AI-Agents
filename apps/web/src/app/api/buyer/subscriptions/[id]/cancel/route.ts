import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST /api/buyer/subscriptions/[id]/cancel — cancel at period end
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "buyer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { id: params.id, buyerId: session.user.id },
  });

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  if (sub.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled." }, { status: 400 });
  }

  // Cancel in Stripe at period end (buyer retains access until then)
  if (sub.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
    await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Mark locally — webhook will confirm when actually deleted
  const updated = await prisma.subscription.update({
    where: { id: params.id },
    data: { status: "cancelled" },
  });

  return NextResponse.json(updated);
}
