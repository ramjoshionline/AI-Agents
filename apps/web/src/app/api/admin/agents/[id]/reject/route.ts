import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/agents/[id]/reject — reject with optional note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agent = await prisma.agent.findUnique({ where: { id: params.id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  if (agent.status !== "review") {
    return NextResponse.json(
      { error: `Agent is not in review status (current: ${agent.status})` },
      { status: 400 }
    );
  }

  let reviewNote: string | undefined;
  try {
    const body = await req.json();
    reviewNote = typeof body.note === "string" ? body.note.trim() : undefined;
  } catch {
    // note is optional
  }

  const updated = await prisma.agent.update({
    where: { id: params.id },
    data: { status: "rejected", reviewNote: reviewNote ?? null },
  });

  return NextResponse.json(updated);
}
