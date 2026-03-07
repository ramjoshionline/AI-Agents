import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST /api/checkout — create a Stripe Checkout session for an agent subscription
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Sign in to subscribe." }, { status: 401 });
  }
  if (session.user.role !== "buyer") {
    return NextResponse.json(
      { error: "Only buyers can subscribe to agents." },
      { status: 403 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 503 }
    );
  }

  const { agentId } = await req.json();
  if (!agentId) {
    return NextResponse.json({ error: "agentId is required." }, { status: 400 });
  }

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, status: "live" },
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  // Prevent duplicate subscriptions
  const existing = await prisma.subscription.findFirst({
    where: {
      buyerId: session.user.id,
      agentId,
      status: { in: ["active", "trialing"] },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have an active subscription to this agent." },
      { status: 409 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email!,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: agent.priceMonthly,
          product_data: {
            name: agent.name,
            description: agent.tagline,
          },
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    ...(agent.trialDays > 0
      ? { subscription_data: { trial_period_days: agent.trialDays } }
      : {}),
    metadata: {
      agentId: agent.id,
      buyerId: session.user.id,
    },
    success_url: `${baseUrl}/dashboard/buyer?subscribed=${agent.id}`,
    cancel_url: `${baseUrl}/marketplace/${agent.id}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
