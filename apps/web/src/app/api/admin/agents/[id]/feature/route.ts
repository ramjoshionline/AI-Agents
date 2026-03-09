import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/agents/[id]/feature  — toggle featured flag (admin only)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    select: { id: true, featured: true, status: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (agent.status !== "live")
    return NextResponse.json(
      { error: "Only live agents can be featured" },
      { status: 400 }
    );

  const updated = await prisma.agent.update({
    where: { id: params.id },
    data: { featured: !agent.featured },
    select: { id: true, featured: true },
  });

  return NextResponse.json(updated);
}
