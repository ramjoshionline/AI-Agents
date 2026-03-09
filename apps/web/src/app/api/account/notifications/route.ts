import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_KEYS = ["emailNewSub", "emailCancellation", "emailPayment"] as const;

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Only accept known boolean keys
  const patch: Record<string, boolean> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body && typeof body[key] === "boolean") patch[key] = body[key];
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notifPrefs: true },
  });
  const prev = JSON.parse(existing?.notifPrefs ?? "{}");
  const next = { ...prev, ...patch };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notifPrefs: JSON.stringify(next) },
  });

  return NextResponse.json(next);
}
