import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import IntegrationsForm from "./IntegrationsForm";

export default async function IntegrationsPage({
  params,
}: {
  params: { subscriptionId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "buyer") redirect("/dashboard/builder");

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: params.subscriptionId,
      buyerId: session.user.id,
    },
    include: {
      agent: {
        select: { id: true, name: true, tagline: true, vertical: true, tools: true },
      },
      integration: true,
    },
  });

  if (!subscription) redirect("/dashboard/buyer");

  const agent = subscription.agent;
  const agentTools: string[] = JSON.parse(agent.tools || "[]");
  const initialConfig = subscription.integration
    ? JSON.parse(subscription.integration.config)
    : {};

  const connectedCount = agentTools.filter(
    (tool) => !!initialConfig[tool]?.[Object.keys(initialConfig[tool] ?? {})[0]]
  ).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/buyer"
          className="text-xs text-dim hover:text-primary transition-colors"
        >
          ← Dashboard
        </Link>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-white">{agent.name}</h1>
            <p className="text-xs text-dim mt-0.5">{agent.tagline}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/dashboard/buyer/chat/${agent.id}`}
              className="text-xs border border-primary/40 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors font-bold"
            >
              Chat →
            </Link>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border p-4 flex items-center justify-between"
          style={{
            background: "rgba(255,149,0,0.04)",
            borderColor: "rgba(255,149,0,0.2)",
          }}
        >
          <div>
            <div className="text-xs font-bold text-white mb-0.5">
              Integrations
            </div>
            <p className="text-xs text-dim">
              Connect external tools so the agent can take real actions on your behalf.
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-lg font-extrabold" style={{ color: connectedCount > 0 ? "#2ECC71" : "#4A6580" }}>
              {connectedCount}/{agentTools.length}
            </div>
            <div className="text-xs text-dim">connected</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <IntegrationsForm
        subscriptionId={subscription.id}
        agentTools={agentTools}
        initialConfig={initialConfig}
      />

      {/* Info footer */}
      <div
        className="mt-8 rounded-xl border p-4 text-xs text-dim leading-relaxed"
        style={{ borderColor: "#1C2D40", background: "#080F18" }}
      >
        <div className="font-bold text-white mb-1">🔒 How your credentials are stored</div>
        <p>
          Integration credentials are stored encrypted in your account and are only
          used by your subscribed agent. They are never shared with other users or
          builders. You can clear any integration at any time by deleting its fields
          and saving.
        </p>
      </div>
    </div>
  );
}
