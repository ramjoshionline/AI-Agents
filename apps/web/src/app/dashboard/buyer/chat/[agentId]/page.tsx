import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChatUI from "./ChatUI";

export default async function BuyerChatPage({
  params,
}: {
  params: { agentId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "buyer") redirect("/dashboard/builder");

  // Verify buyer has an active or trialing subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      buyerId: session.user.id,
      agentId: params.agentId,
      status: { in: ["active", "trialing"] },
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          tagline: true,
          vertical: true,
          status: true,
        },
      },
    },
  });

  if (!subscription || subscription.agent.status !== "live") {
    redirect("/dashboard/buyer");
  }

  const agent = subscription.agent;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const userInitial = (session.user.name ?? session.user.email ?? "?")[0].toUpperCase();

  return (
    <ChatUI
      agentId={agent.id}
      agentName={agent.name}
      agentTagline={agent.tagline}
      agentVertical={agent.vertical}
      hasApiKey={hasApiKey}
      userInitial={userInitial}
    />
  );
}
