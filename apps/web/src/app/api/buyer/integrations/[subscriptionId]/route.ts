import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Verify the subscription belongs to the current buyer
async function getOwnedSubscription(subscriptionId: string, buyerId: string) {
  return prisma.subscription.findFirst({
    where: { id: subscriptionId, buyerId },
  });
}

// GET /api/buyer/integrations/[subscriptionId] — fetch current config
export async function GET(
  _req: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "buyer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getOwnedSubscription(params.subscriptionId, session.user.id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const integration = await prisma.integration.findUnique({
    where: { subscriptionId: params.subscriptionId },
  });

  const config = integration ? JSON.parse(integration.config) : {};
  return NextResponse.json({ config });
}

// PUT /api/buyer/integrations/[subscriptionId] — upsert config
export async function PUT(
  req: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "buyer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getOwnedSubscription(params.subscriptionId, session.user.id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let config: Record<string, unknown>;
  try {
    const body = await req.json();
    if (typeof body.config !== "object" || body.config === null) {
      throw new Error("config must be an object");
    }
    config = body.config;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const integration = await prisma.integration.upsert({
    where: { subscriptionId: params.subscriptionId },
    update: { config: JSON.stringify(config) },
    create: { subscriptionId: params.subscriptionId, config: JSON.stringify(config) },
  });

  return NextResponse.json({ config: JSON.parse(integration.config) });
}
