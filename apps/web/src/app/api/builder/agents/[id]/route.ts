import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Cannot edit while under review
  if (agent.status === "review") {
    return NextResponse.json(
      { error: "Agent is under review and cannot be edited." },
      { status: 400 }
    );
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

    // For live agents: changing systemPrompt triggers re-review.
    const isLive = agent.status === "live";
    const systemPromptChanged =
      isLive &&
      typeof systemPrompt === "string" &&
      systemPrompt.trim() !== agent.systemPrompt;

    const updated = await prisma.agent.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(tagline && { tagline: tagline.trim() }),
        ...(description && { description: description.trim() }),
        ...(vertical && { vertical }),
        ...(systemPrompt && { systemPrompt: systemPrompt.trim() }),
        ...(tools !== undefined && { tools: JSON.stringify(tools) }),
        ...(pricingModel && { pricingModel }),
        ...(priceMonthly !== undefined && {
          priceMonthly: Math.round(priceMonthly * 100),
        }),
        ...(trialDays !== undefined && { trialDays }),
        // Changing system prompt on a live agent sends it back to review
        ...(systemPromptChanged && { status: "review", reviewNote: null }),
      },
    });

    return NextResponse.json({ ...updated, _reReview: systemPromptChanged });
  } catch {
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
