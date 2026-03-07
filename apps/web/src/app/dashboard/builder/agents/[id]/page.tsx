import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AgentDetailClient from "./AgentDetailClient";
import { STATUS_CONFIG, TOOLS } from "@/lib/agentConstants";

export default async function AgentDetailPage({
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

  const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.draft;
  const toolIds: string[] = JSON.parse(agent.tools);
  const toolNames = TOOLS.filter((t) => toolIds.includes(t.id)).map(
    (t) => `${t.icon} ${t.name}`
  );
  const priceDisplay = `$${(agent.priceMonthly / 100).toFixed(0)}/mo`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-dim mb-6">
        <Link
          href="/dashboard/builder"
          className="hover:text-text-main transition-colors"
        >
          Dashboard
        </Link>
        <span>›</span>
        <Link
          href="/dashboard/builder/agents"
          className="hover:text-text-main transition-colors"
        >
          My Agents
        </Link>
        <span>›</span>
        <span className="text-text-main truncate max-w-32">{agent.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-extrabold text-white">{agent.name}</h1>
            <span
              className="text-xs px-2.5 py-1 rounded font-bold"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          </div>
          <p className="text-xs text-dim mt-1">{statusCfg.desc}</p>
        </div>

        {/* Actions */}
        <AgentDetailClient
          agentId={agent.id}
          status={agent.status}
        />
      </div>

      {/* Review note */}
      {agent.status === "rejected" && agent.reviewNote && (
        <div
          className="rounded-xl p-5 border mb-6"
          style={{
            background: "rgba(231,76,60,0.08)",
            borderColor: "rgba(231,76,60,0.3)",
          }}
        >
          <div className="text-xs font-bold text-red mb-1">
            ❌ Review Feedback
          </div>
          <p className="text-xs text-text-main leading-relaxed">
            {agent.reviewNote}
          </p>
          <p className="text-xs text-dim mt-2">
            Edit your agent and re-submit for review.
          </p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Left column */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-dim uppercase tracking-widest mb-4">
              Identity
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="text-dim mb-1">Name</div>
                <div className="text-white font-bold">{agent.name}</div>
              </div>
              <div>
                <div className="text-dim mb-1">Tagline</div>
                <div className="text-text-main">{agent.tagline}</div>
              </div>
              <div>
                <div className="text-dim mb-1">Vertical</div>
                <div className="text-text-main">{agent.vertical}</div>
              </div>
              <div>
                <div className="text-dim mb-1">Description</div>
                <div className="text-text-main leading-relaxed">
                  {agent.description}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-dim uppercase tracking-widest mb-4">
              Pricing
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-dim">Model</span>
                <span className="text-white font-bold capitalize">
                  {agent.pricingModel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Price</span>
                <span className="text-primary font-bold">{priceDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Free Trial</span>
                <span className="text-text-main">
                  {agent.trialDays === 0
                    ? "None"
                    : `${agent.trialDays} days`}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-dim">Your cut</span>
                <span className="text-green font-bold">~70–75%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-dim uppercase tracking-widest mb-4">
              Integrations ({toolNames.length})
            </div>
            {toolNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {toolNames.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{
                      background: "rgba(59,158,255,0.1)",
                      color: "#3B9EFF",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-dim">No integrations selected.</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-dim uppercase tracking-widest mb-3">
              System Prompt
            </div>
            <div
              className="text-xs text-dim leading-relaxed rounded-lg p-3 border max-h-48 overflow-y-auto"
              style={{ background: "#070B0F", borderColor: "#1C2D40" }}
            >
              <pre className="whitespace-pre-wrap font-mono">
                {agent.systemPrompt}
              </pre>
            </div>
            <p className="text-xs text-dim mt-2">
              🔒 Never shown to buyers or subscribers.
            </p>
          </div>

          {/* Stats (placeholder for M5+) */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-dim uppercase tracking-widest mb-3">
              Performance
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { label: "Subscribers", value: "0", color: "#2ECC71" },
                { label: "MRR", value: "$0", color: "#FF9500" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-lg p-3"
                  style={{ background: "#111A28" }}
                >
                  <div
                    className="text-lg font-extrabold"
                    style={{ color }}
                  >
                    {value}
                  </div>
                  <div className="text-xs text-dim">{label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-dim text-center mt-2">
              Live data available after M5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
