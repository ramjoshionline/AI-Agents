import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { STATUS_CONFIG } from "@/lib/agentConstants";

export default async function BuilderAgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "builder") redirect("/sign-in");

  const agents = await prisma.agent.findMany({
    where: { builderId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-blue uppercase tracking-widest mb-1">
            Builder Dashboard
          </div>
          <h1 className="text-xl font-extrabold text-white">My Agents</h1>
          <p className="text-xs text-dim mt-1">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} · manage,
            edit, and track performance
          </p>
        </div>
        <Link
          href="/dashboard/builder/agents/new"
          className="bg-primary text-black font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shrink-0"
        >
          + Create Agent
        </Link>
      </div>

      {/* Agent list */}
      {agents.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed p-16 text-center"
          style={{ borderColor: "#1C2D40" }}
        >
          <div className="text-5xl mb-4">🤖</div>
          <div className="text-sm font-bold text-white mb-2">
            No agents yet
          </div>
          <p className="text-xs text-dim max-w-xs mx-auto leading-relaxed mb-6">
            Create your first agent, configure it with a system prompt and tools,
            then submit it for review.
          </p>
          <Link
            href="/dashboard/builder/agents/new"
            className="inline-flex items-center gap-2 bg-blue/10 border border-blue/30 text-blue font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-blue/20 transition-colors"
          >
            Create Your First Agent →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => {
            const statusCfg =
              STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.draft;
            const price = (agent.priceMonthly / 100).toFixed(0);

            return (
              <Link
                key={agent.id}
                href={`/dashboard/builder/agents/${agent.id}`}
                className="block bg-card border border-border rounded-xl p-5 card-hover group"
              >
                <div className="flex items-start gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                        {agent.name}
                      </span>
                      {/* Status badge */}
                      <span
                        className="text-xs px-2 py-0.5 rounded font-bold shrink-0"
                        style={{
                          background: statusCfg.bg,
                          color: statusCfg.color,
                        }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-dim truncate mb-2">
                      {agent.tagline}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dim">
                      <span>{agent.vertical}</span>
                      <span>·</span>
                      <span>${price}/mo</span>
                      <span>·</span>
                      <span>
                        {
                          (JSON.parse(agent.tools) as string[]).length
                        }{" "}
                        integration
                        {(JSON.parse(agent.tools) as string[]).length !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    {/* Review note if rejected */}
                    {agent.status === "rejected" && agent.reviewNote && (
                      <div
                        className="mt-3 text-xs rounded-lg px-3 py-2 border"
                        style={{
                          background: "rgba(231,76,60,0.08)",
                          borderColor: "rgba(231,76,60,0.25)",
                          color: "#E74C3C",
                        }}
                      >
                        ❌ Review feedback: {agent.reviewNote}
                      </div>
                    )}
                  </div>

                  {/* Right: arrow */}
                  <div className="text-dim group-hover:text-primary transition-colors text-sm shrink-0">
                    →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {agents.length > 0 && (
        <div className="mt-8 border border-border rounded-xl p-5">
          <div className="text-xs text-dim uppercase tracking-widest mb-3">
            Status Guide
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-start gap-3">
                <span
                  className="text-xs px-2 py-0.5 rounded font-bold shrink-0 mt-0.5"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-dim leading-relaxed">
                  {cfg.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
