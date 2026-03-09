import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VERTICALS, PRICING_MODELS, TOOLS } from "@/lib/agentConstants";

const VALID_VERTICALS = VERTICALS;
const VALID_PRICING_MODELS = PRICING_MODELS.map((p) => p.id);
const VALID_TOOL_IDS = TOOLS.map((t) => t.id);

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

    // Validate enum fields
    if (!VALID_VERTICALS.includes(vertical)) {
      return NextResponse.json({ error: "Invalid vertical." }, { status: 400 });
    }
    if (!VALID_PRICING_MODELS.includes(pricingModel)) {
      return NextResponse.json({ error: "Invalid pricingModel." }, { status: 400 });
    }

    // Validate numeric fields
    const price = Number(priceMonthly);
    if (!Number.isFinite(price) || price < 0 || price > 99999) {
      return NextResponse.json({ error: "priceMonthly must be between 0 and 99999." }, { status: 400 });
    }
    const trial = Number(trialDays);
    if (!Number.isInteger(trial) || trial < 0 || trial > 365) {
      return NextResponse.json({ error: "trialDays must be an integer between 0 and 365." }, { status: 400 });
    }

    // Validate tools array
    if (!Array.isArray(tools) || tools.length > 20 || tools.some((t: unknown) => !VALID_TOOL_IDS.includes(t as string))) {
      return NextResponse.json({ error: "Invalid tools selection." }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        name: name.trim().slice(0, 80),
        tagline: tagline.trim().slice(0, 120),
        description: description.trim().slice(0, 2000),
        vertical,
        systemPrompt: systemPrompt.trim().slice(0, 10000),
        tools: JSON.stringify(tools),
        pricingModel,
        priceMonthly: Math.round(price * 100), // store in cents
        trialDays: trial,
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
