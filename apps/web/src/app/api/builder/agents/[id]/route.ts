import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VERTICALS, PRICING_MODELS, TOOLS } from "@/lib/agentConstants";

const VALID_VERTICALS = VERTICALS;
const VALID_PRICING_MODELS = PRICING_MODELS.map((p) => p.id);
const VALID_TOOL_IDS = TOOLS.map((t) => t.id);

async function getOwnedAgent(agentId: string, builderId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, builderId },
  });
}

// GET /api/builder/agents/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "builder") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agent = await getOwnedAgent(params.id, session.user.id);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  return NextResponse.json(agent);
}

// PATCH /api/builder/agents/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "builder") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agent = await getOwnedAgent(params.id, session.user.id);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const {
      name,
      tagline,
      description,
      vertical,
      systemPrompt,
      tools,
      pricingModel,
      priceMonthly,
      trialDays,
    } = body;

    // Validate enum fields if provided
    if (vertical !== undefined && !VALID_VERTICALS.includes(vertical)) {
      return NextResponse.json({ error: "Invalid vertical." }, { status: 400 });
    }
    if (pricingModel !== undefined && !VALID_PRICING_MODELS.includes(pricingModel)) {
      return NextResponse.json({ error: "Invalid pricingModel." }, { status: 400 });
    }

    // Validate numeric fields if provided
    if (priceMonthly !== undefined) {
      const price = Number(priceMonthly);
      if (!Number.isFinite(price) || price < 0 || price > 99999) {
        return NextResponse.json({ error: "priceMonthly must be between 0 and 99999." }, { status: 400 });
      }
    }
    if (trialDays !== undefined) {
      if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 365) {
        return NextResponse.json({ error: "trialDays must be an integer between 0 and 365." }, { status: 400 });
      }
    }

    // Validate tools array if provided
    if (tools !== undefined) {
      if (!Array.isArray(tools) || tools.length > 20 || tools.some((t: unknown) => !VALID_TOOL_IDS.includes(t as string))) {
        return NextResponse.json({ error: "Invalid tools selection." }, { status: 400 });
      }
    }

    // Use a transaction to atomically check status and update (prevents TOCTOU race)
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.agent.findFirst({
        where: { id: params.id, builderId: session.user.id },
      });
      if (!current) throw Object.assign(new Error("Not found"), { code: "NOT_FOUND" });
      if (current.status === "review") {
        throw Object.assign(new Error("Agent is under review and cannot be edited."), { code: "UNDER_REVIEW" });
      }

      const isLive = current.status === "live";
      const systemPromptChanged =
        isLive &&
        typeof systemPrompt === "string" &&
        systemPrompt.trim() !== current.systemPrompt;

      const result = await tx.agent.update({
        where: { id: params.id },
        data: {
          ...(name && { name: name.trim().slice(0, 80) }),
          ...(tagline && { tagline: tagline.trim().slice(0, 120) }),
          ...(description && { description: description.trim().slice(0, 2000) }),
          ...(vertical && { vertical }),
          ...(systemPrompt && { systemPrompt: systemPrompt.trim().slice(0, 10000) }),
          ...(tools !== undefined && { tools: JSON.stringify(tools) }),
          ...(pricingModel && { pricingModel }),
          ...(priceMonthly !== undefined && {
            priceMonthly: Math.round(Number(priceMonthly) * 100),
          }),
          ...(trialDays !== undefined && { trialDays }),
          ...(systemPromptChanged && { status: "review", reviewNote: null }),
        },
      });
      return { ...result, _reReview: systemPromptChanged };
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "NOT_FOUND") {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }
    if (code === "UNDER_REVIEW") {
      return NextResponse.json({ error: "Agent is under review and cannot be edited." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update agent." },
      { status: 500 }
    );
  }
}

// DELETE /api/builder/agents/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "builder") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agent = await getOwnedAgent(params.id, session.user.id);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  // Live agents are delisted (→ draft) rather than hard-deleted
  // so subscriber records and reviews are preserved
  if (agent.status === "live") {
    const updated = await prisma.agent.update({
      where: { id: params.id },
      data: { status: "draft", featured: false },
    });
    return NextResponse.json({ delisted: true, id: updated.id });
  }

  await prisma.agent.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
