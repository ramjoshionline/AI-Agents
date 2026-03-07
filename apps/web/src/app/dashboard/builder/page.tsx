import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { STATUS_CONFIG } from "@/lib/agentConstants";

export default async function BuilderDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "builder") redirect("/dashboard/buyer");

  const firstName = session.user.name?.split(" ")[0] || "Builder";

  // Real agent data
  const agents = await prisma.agent.findMany({
    where: { builderId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const totalAgents = await prisma.agent.count({
    where: { builderId: session.user.id },
  });
  const liveAgents = await prisma.agent.count({
    where: { builderId: session.user.id, status: "live" },
  });

  // Real subscription stats: count active/trialing subscriptions across all this builder's agents
  const activeSubs = await prisma.subscription.findMany({
    where: {
      agent: { builderId: session.user.id },
      status: { in: ["active", "trialing"] },
    },
    include: { agent: { select: { priceMonthly: true } } },
  });
  const totalSubscribers = activeSubs.length;
  const grossMrr = activeSubs.reduce((sum, s) => sum + s.agent.priceMonthly, 0);
  const netMrr = Math.round(grossMrr * 0.725); // ~72.5% builder cut

  const STAT_CARDS = [
    {
      label: "Listed Agents",
      value: String(totalAgents),
      icon: "🤖",
      color: "#3B9EFF",
      note: `${liveAgents} live`,
    },
    {
      label: "Total Subscribers",
      value: String(totalSubscribers),
      icon: "🏢",
      color: "#2ECC71",
      note: "active + trialing",
    },
    {
      label: "MRR",
      value: grossMrr > 0 ? `$${(grossMrr / 100).toFixed(0)}` : "$0",
      icon: "💸",
      color: "#FF9500",
      note: "gross monthly recurring",
    },
    {
      label: "Your Cut",
      value: netMrr > 0 ? `$${(netMrr / 100).toFixed(0)}` : "$0",
      icon: "📈",
      color: "#9B59B6",
      note: "earned so far",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue animate-pulse" />
          <span className="text-xs text-blue font-bold uppercase tracking-wide">
            Builder Dashboard
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white">
          Welcome, {firstName} 👩‍💻
        </h1>
        <p className="text-sm text-dim mt-1">
          Build agents. Set your price. Earn recurring revenue — we handle everything else.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon, color, note }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim uppercase tracking-wide">
                {label}
              </span>
              <span className="text-lg">{icon}</span>
            </div>
            <div className="text-2xl font-extrabold mb-0.5" style={{ color }}>
              {value}
            </div>
            <div className="text-xs text-dim">{note}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* My Agents */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">My Agents</h2>
              <Link
                href="/dashboard/builder/agents/new"
                className="text-xs bg-primary/10 border border-primary/30 text-primary font-bold px-4 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
              >
                + Create Agent
              </Link>
            </div>

            {agents.length === 0 ? (
              <div
                className="rounded-xl border-2 border-dashed p-10 text-center"
                style={{ borderColor: "#1C2D40" }}
              >
                <div className="text-4xl mb-4">🤖</div>
                <div className="text-sm font-bold text-white mb-2">
                  No agents listed yet
                </div>
                <p className="text-xs text-dim leading-relaxed max-w-xs mx-auto mb-6">
                  Create your first agent, set your price, and submit for
                  review.
                </p>
                <Link
                  href="/dashboard/builder/agents/new"
                  className="inline-flex items-center gap-2 bg-blue/10 border border-blue/30 text-blue font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-blue/20 transition-colors"
                >
                  Create Your First Agent →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map((agent) => {
                  const statusCfg =
                    STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.draft;
                  return (
                    <Link
                      key={agent.id}
                      href={`/dashboard/builder/agents/${agent.id}`}
                      className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 card-hover group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                            {agent.name}
                          </span>
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
                        <div className="text-xs text-dim mt-0.5 truncate">
                          {agent.vertical} · $
                          {(agent.priceMonthly / 100).toFixed(0)}/mo
                        </div>
                      </div>
                      <span className="text-dim group-hover:text-primary transition-colors text-sm shrink-0">
                        →
                      </span>
                    </Link>
                  );
                })}
                {totalAgents > 5 && (
                  <Link
                    href="/dashboard/builder/agents"
                    className="block text-center text-xs text-primary hover:text-primary/80 transition-colors py-3"
                  >
                    View all {totalAgents} agents →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Earnings Overview (placeholder) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Earnings Overview</h2>
              <span
                className="text-xs px-2 py-0.5 rounded font-bold"
                style={{ background: "rgba(255,149,0,0.1)", color: "#FF9500" }}
              >
                Charts in M8
              </span>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div
                className="h-28 rounded-lg flex items-center justify-center"
                style={{ background: "#111A28" }}
              >
                <p className="text-xs text-dim">
                  Earnings chart will appear here once you have active
                  subscribers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                {
                  icon: "🔨",
                  label: "Create New Agent",
                  href: "/dashboard/builder/agents/new",
                  color: "#3B9EFF",
                  badge: null,
                },
                {
                  icon: "📋",
                  label: "View All Agents",
                  href: "/dashboard/builder/agents",
                  color: "#2ECC71",
                  badge: null,
                },
                {
                  icon: "💸",
                  label: "Payout Settings",
                  href: "#",
                  color: "#FF9500",
                  badge: "Soon",
                },
                {
                  icon: "📖",
                  label: "Builder Guide",
                  href: "/builders",
                  color: "#9B59B6",
                  badge: null,
                },
              ].map(({ icon, label, href, color, badge }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/30 transition-colors group"
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-xs text-text-main group-hover:text-white transition-colors flex-1">
                    {label}
                  </span>
                  {badge ? (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: `${color}15`, color }}
                    >
                      {badge}
                    </span>
                  ) : (
                    <span className="text-dim text-xs">→</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Revenue model */}
          <div
            className="rounded-xl p-4 border"
            style={{
              background: "rgba(59,158,255,0.05)",
              borderColor: "rgba(59,158,255,0.2)",
            }}
          >
            <div className="text-xs font-bold text-blue mb-2">
              Your Revenue Split
            </div>
            <div className="space-y-2 text-xs text-dim">
              <div className="flex justify-between">
                <span>You keep</span>
                <span className="text-green font-bold">70–75%</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee</span>
                <span className="text-primary">25–30%</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span>Payout via</span>
                <span className="text-text-main">Stripe Connect</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Builder onboarding */}
      {totalAgents === 0 && (
        <div
          className="mt-8 rounded-xl border p-6"
          style={{
            background: "rgba(59,158,255,0.04)",
            borderColor: "rgba(59,158,255,0.2)",
          }}
        >
          <h2 className="text-sm font-bold text-white mb-4">
            🚀 Ship your first agent
          </h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Create Agent", desc: "Define behaviour, tools, pricing", done: true },
              { step: "2", title: "Test in Sandbox", desc: "Chat with it before submitting", done: false },
              { step: "3", title: "Submit for Review", desc: "We QA it within 48h", done: false },
              { step: "4", title: "Go Live & Earn", desc: "Listed in marketplace, earn MRR", done: false },
            ].map(({ step, title, desc, done }) => (
              <div key={step} className="flex items-start gap-3">
                <Link
                  href="/dashboard/builder/agents/new"
                  className="w-6 h-6 rounded-full border-2 border-blue/40 bg-blue/10 flex items-center justify-center text-blue text-xs font-bold shrink-0 mt-0.5 hover:border-blue transition-colors"
                >
                  {done ? "→" : step}
                </Link>
                <div>
                  <div className="text-xs font-bold text-white">{title}</div>
                  <div className="text-xs text-dim mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
