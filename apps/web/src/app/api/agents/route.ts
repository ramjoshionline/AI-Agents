import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/agents — public marketplace listing (live agents only)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vertical = searchParams.get("vertical");
  const search = searchParams.get("search")?.trim();

  const agents = await prisma.agent.findMany({
    where: {
      status: "live",
      ...(vertical ? { vertical } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { tagline: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      vertical: true,
      tools: true,
      pricingModel: true,
      priceMonthly: true,
      trialDays: true,
      // Never expose systemPrompt or builderId in public API
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(agents);
}
