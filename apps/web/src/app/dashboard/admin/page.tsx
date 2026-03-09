export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReviewActions from "./ReviewActions";
import FeaturedToggle from "./FeaturedToggle";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "#4A6580", bg: "rgba(74,101,128,0.15)" },
  review:   { label: "In Review", color: "#FF9500", bg: "rgba(255,149,0,0.12)" },
  live:     { label: "Live",     color: "#2ECC71", bg: "rgba(46,204,113,0.12)" },
  rejected: { label: "Rejected", color: "#E74C3C", bg: "rgba(231,76,60,0.10)" },
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/dashboard");

  // Pending review queue
  const reviewQueue = await prisma.agent.findMany({
    where: { status: "review" },
    include: { builder: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "asc" }, // oldest first
  });

  // Recent history (last 20 approved/rejected)
  const history = await prisma.agent.findMany({
    where: { status: { in: ["live", "rejected"] } },
    include: { builder: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  // Stats
  const [totalAgents, totalUsers, liveAgents, totalSubs] = await Promise.all([
    prisma.agent.count(),
    prisma.user.count(),
    prisma.agent.count({ where: { status: "live" } }),
    prisma.subscription.count({ where: { status: { in: ["active", "trialing"] } } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#E74C3C" }}
          />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#E74C3C" }}>
            Admin
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white">
          Review Queue
        </h1>
        <p className="text-sm text-dim mt-1">
          Approve or reject agent submissions before they go live on the marketplace.
        </p>
        <Link
          href="/dashboard/admin/analytics"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(231,76,60,0.1)", color: "#E74C3C" }}
        >
          📊 View Platform Analytics →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending Review", value: String(reviewQueue.length), icon: "⏳", color: "#FF9500" },
          { label: "Live Agents",    value: String(liveAgents),         icon: "🟢", color: "#2ECC71" },
          { label: "Total Users",    value: String(totalUsers),         icon: "👥", color: "#3B9EFF" },
          { label: "Active Subs",    value: String(totalSubs),          icon: "💳", color: "#9B59B6" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim uppercase tracking-wide">{label}</span>
              <span className="text-lg">{icon}</span>
            </div>
            <div className="text-2xl font-extrabold" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Review Queue */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-white mb-4">
          Pending Review
          {reviewQueue.length > 0 && (
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded font-bold"
              style={{ background: "rgba(255,149,0,0.12)", color: "#FF9500" }}
            >
              {reviewQueue.length}
            </span>
          )}
        </h2>

        {reviewQueue.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed p-10 text-center"
            style={{ borderColor: "#1C2D40" }}
          >
            <div className="text-3xl mb-3">✅</div>
            <div className="text-sm font-bold text-white mb-1">Queue is clear</div>
            <p className="text-xs text-dim">No agents are awaiting review right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewQueue.map((agent) => (
              <div
                key={agent.id}
                className="bg-card border border-border rounded-xl p-5"
                style={{ borderColor: "rgba(255,149,0,0.2)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-white truncate">
                        {agent.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded font-bold shrink-0"
                        style={STATUS_STYLE.review}
                      >
                        {STATUS_STYLE.review.label}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded shrink-0"
                        style={{ background: "rgba(74,101,128,0.15)", color: "#4A6580" }}
                      >
                        {agent.vertical}
                      </span>
                    </div>
                    <p className="text-xs text-dim truncate mb-2">{agent.tagline}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim mb-3">
                      <span>
                        Builder:{" "}
                        <span className="text-text-main">
                          {agent.builder.name ?? agent.builder.email}
                        </span>
                      </span>
                      <span>
                        Price:{" "}
                        <span className="text-text-main">
                          ${(agent.priceMonthly / 100).toFixed(0)}/mo
                        </span>
                      </span>
                      {agent.trialDays > 0 && (
                        <span className="text-primary">
                          {agent.trialDays}-day trial
                        </span>
                      )}
                      <span>
                        Submitted:{" "}
                        {new Date(agent.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* System prompt preview */}
                    <details className="group">
                      <summary className="text-xs text-dim hover:text-primary cursor-pointer transition-colors select-none">
                        View system prompt ›
                      </summary>
                      <pre
                        className="mt-2 text-xs text-dim leading-relaxed whitespace-pre-wrap font-mono max-h-48 overflow-y-auto rounded-lg p-3"
                        style={{ background: "#080F18", border: "1px solid #1C2D40" }}
                      >
                        {agent.systemPrompt}
                      </pre>
                    </details>
                  </div>

                  <div className="shrink-0">
                    <ReviewActions agentId={agent.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <h2 className="text-sm font-bold text-white mb-4">
          Recent Decisions
          <span className="ml-2 text-xs text-dim font-normal">(last 20)</span>
        </h2>

        {history.length === 0 ? (
          <p className="text-xs text-dim">No approved or rejected agents yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-dim border-b" style={{ borderColor: "#1C2D40" }}>
                  <th className="text-left py-2 pr-4 font-medium">Agent</th>
                  <th className="text-left py-2 pr-4 font-medium">Builder</th>
                  <th className="text-left py-2 pr-4 font-medium">Vertical</th>
                  <th className="text-left py-2 pr-4 font-medium">Status</th>
                  <th className="text-left py-2 pr-4 font-medium">Decided</th>
                  <th className="text-left py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((agent) => {
                  const style = STATUS_STYLE[agent.status] ?? STATUS_STYLE.draft;
                  return (
                    <tr
                      key={agent.id}
                      className="border-b hover:bg-card/50 transition-colors"
                      style={{ borderColor: "#1C2D40" }}
                    >
                      <td className="py-2.5 pr-4 font-bold text-white truncate max-w-[160px]">
                        {agent.name}
                      </td>
                      <td className="py-2.5 pr-4 text-dim truncate max-w-[140px]">
                        {agent.builder.name ?? agent.builder.email}
                      </td>
                      <td className="py-2.5 pr-4 text-dim">{agent.vertical}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className="px-2 py-0.5 rounded font-bold"
                          style={style}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-dim">
                        {new Date(agent.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 pr-4 text-dim truncate max-w-[200px]">
                        {agent.reviewNote ? (
                          <span title={agent.reviewNote}>{agent.reviewNote}</span>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {agent.status === "live" && (
                          <FeaturedToggle agentId={agent.id} featured={agent.featured} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Platform links */}
      <div className="mt-10 pt-6 border-t flex flex-wrap gap-4 text-xs text-dim" style={{ borderColor: "#1C2D40" }}>
        <Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace →</Link>
        <Link href="/dashboard/builder" className="hover:text-primary transition-colors">Builder Dashboard →</Link>
        <span>Total agents in DB: {totalAgents}</span>
      </div>
    </div>
  );
}
