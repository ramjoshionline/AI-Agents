import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/builder/agents — list this builder's agents
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "builder") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.agent.findMany({
    where: { builderId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(agents);
}

// POST /api/builder/agents — create a new agent
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "builder") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      tagline,
      description,
      vertical,
      systemPrompt,
      tools = [],
      pricingModel = "flat",
      priceMonthly = 0,
      trialDays = 0,
      submitForReview = false,
    } = body;

    if (!name || !tagline || !description || !vertical || !systemPrompt) {
      return NextResponse.json(
        { error: "name, tagline, description, vertical, and systemPrompt are required." },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        vertical,
        systemPrompt: systemPrompt.trim(),
        tools: JSON.stringify(tools),
        pricingModel,
        priceMonthly: Math.round(priceMonthly * 100), // store in cents
        trialDays,
        status: submitForReview ? "review" : "draft",
        builderId: session.user.id,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create agent." },
      { status: 500 }
    );
  }
}
