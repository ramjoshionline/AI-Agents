import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SandboxChat from "./SandboxChat";

export default async function SandboxPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "builder") redirect("/sign-in");

  const agent = await prisma.agent.findFirst({
    where: { id: params.id, builderId: session.user.id },
  });

  if (!agent) notFound();

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <SandboxChat
      agentId={agent.id}
      agentName={agent.name}
      agentTagline={agent.tagline}
      systemPrompt={agent.systemPrompt}
      hasApiKey={hasApiKey}
    />
  );
}
