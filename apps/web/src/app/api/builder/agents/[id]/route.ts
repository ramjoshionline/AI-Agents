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

  // Can only edit drafts or rejected agents
  if (!["draft", "rejected"].includes(agent.status)) {
    return NextResponse.json(
      { error: "Only draft or rejected agents can be edited." },
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
      },
    });

    return NextResponse.json(updated);
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

  if (agent.status === "live") {
    return NextResponse.json(
      { error: "Cannot delete a live agent. Archive it instead." },
      { status: 400 }
    );
  }

  await prisma.agent.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
