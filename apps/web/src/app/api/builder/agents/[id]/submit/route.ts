import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/builder/agents/[id]/submit — submit agent for review
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "builder") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agent = await prisma.agent.findFirst({
    where: { id: params.id, builderId: session.user.id },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  if (!["draft", "rejected"].includes(agent.status)) {
    return NextResponse.json(
      { error: `Agent is already in '${agent.status}' status.` },
      { status: 400 }
    );
  }

  const updated = await prisma.agent.update({
    where: { id: params.id },
    data: { status: "review", reviewNote: null },
  });

  return NextResponse.json(updated);
}
