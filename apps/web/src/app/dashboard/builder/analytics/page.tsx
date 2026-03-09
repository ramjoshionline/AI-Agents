export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// ─── helpers ─────────────────────────────────────────────────────────────────

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function last12Months(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function shortMonth(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
}

// ─── CSS bar chart ────────────────────────────────────────────────────────────

function BarChart({
  months,
  data,
  color,
  maxOverride,
}: {
  months: string[];
  data: Record<string, number>;
  color: string;
  maxOverride?: number;
}) {
  const values = months.map((m) => data[m] ?? 0);
  const max = maxOverride ?? Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1 h-20 w-full">
      {months.map((m, i) => {
        const val = values[i];
        const pct = max > 0 ? (val / max) * 100 : 0;
        return (
          <div
            key={m}
            className="flex-1 flex flex-col items-center gap-1 group relative"
          >
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${Math.max(pct, val > 0 ? 4 : 1)}%`,
                background: val > 0 ? color : "rgba(74,101,128,0.2)",
                minHeight: "2px",
              }}
            />
            {/* Tooltip */}
            {val > 0 && (
              <div
                className="absolute bottom-full mb-1 text-xs font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                style={{ background: "#0C1520", color, border: `1px solid ${color}40` }}
              >
                {val}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChartLabels({ months }: { months: string[] }) {
  return (
    <div className="flex gap-1 mt-1">
      {months.map((m, i) => (
        <div key={m} className="flex-1 text-center" style={{ fontSize: "9px", color: "#4A6580" }}>
          {i === 0 || i === 5 || i === 11 ? shortMonth(m) : ""}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BuilderAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "builder") redirect("/dashboard/buyer");

  const months = last12Months();

  // All of this builder's agents
  const agents = await prisma.agent.findMany({
    where: { builderId: session.user.id },
    select: { id: true, name: true, vertical: true, priceMonthly: true, status: true, trialDays: true },
    orderBy: { createdAt: "asc" },
  });

  const agentIds = agents.map((a) => a.id);

  // All subscriptions across all agents
  const allSubs = await prisma.subscription.findMany({
    where: { agentId: { in: agentIds } },
    select: {
      id: true,
      agentId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // ── Monthly new subscribers ──────────────────────────────────────────────
  const newSubsByMonth: Record<string, number> = {};
  for (const sub of allSubs) {
    const k = monthKey(new Date(sub.createdAt));
    newSubsByMonth[k] = (newSubsByMonth[k] ?? 0) + 1;
  }

  // ── Monthly cancellations ────────────────────────────────────────────────
  const cancelsByMonth: Record<string, number> = {};
  for (const sub of allSubs.filter((s) => s.status === "cancelled")) {
    const k = monthKey(new Date(sub.updatedAt));
    cancelsByMonth[k] = (cancelsByMonth[k] ?? 0) + 1;
  }

  // ── MRR by month (cumulative active subs × price at month boundary) ─────
  // Simplified: count active subs created in or before each month × agent price
  const mrrByMonth: Record<string, number> = {};
  for (const m of months) {
    const [y, mo] = m.split("-").map(Number);
    const endOfMonth = new Date(y, mo, 1); // first of next month
    const activeThen = allSubs.filter((s) => {
      const created = new Date(s.createdAt);
      const cancelled = s.status === "cancelled" ? new Date(s.updatedAt) : null;
      return created < endOfMonth && (!cancelled || cancelled >= endOfMonth);
    });
    const mrr = activeThen.reduce((sum, s) => {
      const agent = agents.find((a) => a.id === s.agentId);
      return sum + (agent?.priceMonthly ?? 0);
    }, 0);
    mrrByMonth[m] = Math.round(mrr / 100); // in dollars
  }

  // ── Per-agent stats ───────────────────────────────────────────────────────
  const perAgent = agents.map((agent) => {
    const subs = allSubs.filter((s) => s.agentId === agent.id);
    const active = subs.filter((s) => s.status === "active").length;
    const trialing = subs.filter((s) => s.status === "trialing").length;
    const cancelled = subs.filter((s) => s.status === "cancelled").length;
    const total = subs.length;
    const mrr = (active + trialing) * agent.priceMonthly;
    const churnRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    return { ...agent, active, trialing, cancelled, total, mrr, churnRate };
  });

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalSubs = allSubs.filter((s) =>
    ["active", "trialing"].includes(s.status)
  ).length;
  const currentMrr = mrrByMonth[months[11]] ?? 0;
  const prevMrr = mrrByMonth[months[10]] ?? 0;
  const mrrDelta = currentMrr - prevMrr;

  const totalCancelled = allSubs.filter((s) => s.status === "cancelled").length;
  const churnRate =
    allSubs.length > 0
      ? Math.round((totalCancelled / allSubs.length) * 100)
      : 0;

  const newThisMonth = newSubsByMonth[months[11]] ?? 0;
  const newLastMonth = newSubsByMonth[months[10]] ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/builder"
            className="text-xs text-dim hover:text-primary transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-extrabold text-white mt-2">Analytics</h1>
          <p className="text-xs text-dim mt-1">
            Last 12 months · all agents
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Active Subscribers",
            value: String(totalSubs),
            sub: `+${newThisMonth} this month`,
            subPrev: newLastMonth > 0 ? `+${newLastMonth} last month` : null,
            color: "#2ECC71",
            icon: "👥",
          },
          {
            label: "Current MRR",
            value: `$${currentMrr.toLocaleString()}`,
            sub: mrrDelta >= 0 ? `+$${mrrDelta} vs last month` : `-$${Math.abs(mrrDelta)} vs last month`,
            subPrev: null,
            color: "#FF9500",
            icon: "💸",
          },
          {
            label: "Your Cut (72.5%)",
            value: `$${Math.round(currentMrr * 0.725).toLocaleString()}`,
            sub: "after platform fee",
            subPrev: null,
            color: "#9B59B6",
            icon: "📈",
          },
          {
            label: "Churn Rate",
            value: `${churnRate}%`,
            sub: `${totalCancelled} cancelled all-time`,
            subPrev: null,
            color: churnRate > 20 ? "#E74C3C" : churnRate > 10 ? "#FF9500" : "#2ECC71",
            icon: "📉",
          },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim uppercase tracking-wide">{label}</span>
              <span className="text-lg">{icon}</span>
            </div>
            <div className="text-2xl font-extrabold mb-1" style={{ color }}>
              {value}
            </div>
            <div className="text-xs text-dim">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* New subscribers */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-white">New Subscribers</div>
              <div className="text-xs text-dim">per month, last 12 months</div>
            </div>
            <div className="text-lg font-extrabold" style={{ color: "#2ECC71" }}>
              {newThisMonth} <span className="text-xs font-normal text-dim">this mo.</span>
            </div>
          </div>
          <BarChart months={months} data={newSubsByMonth} color="#2ECC71" />
          <ChartLabels months={months} />
        </div>

        {/* MRR */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-white">Monthly Recurring Revenue</div>
              <div className="text-xs text-dim">gross MRR, last 12 months</div>
            </div>
            <div className="text-lg font-extrabold" style={{ color: "#FF9500" }}>
              ${currentMrr.toLocaleString()} <span className="text-xs font-normal text-dim">now</span>
            </div>
          </div>
          <BarChart months={months} data={mrrByMonth} color="#FF9500" />
          <ChartLabels months={months} />
        </div>
      </div>

      {/* Cancellations chart */}
      {totalCancelled > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-white">Cancellations</div>
              <div className="text-xs text-dim">per month, last 12 months</div>
            </div>
            <div className="text-lg font-extrabold" style={{ color: "#E74C3C" }}>
              {cancelsByMonth[months[11]] ?? 0} <span className="text-xs font-normal text-dim">this mo.</span>
            </div>
          </div>
          <BarChart months={months} data={cancelsByMonth} color="#E74C3C" />
          <ChartLabels months={months} />
        </div>
      )}

      {/* Per-agent breakdown */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-white mb-4">Per-Agent Breakdown</h2>
        {perAgent.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed p-10 text-center"
            style={{ borderColor: "#1C2D40" }}
          >
            <p className="text-xs text-dim">No agents yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-dim border-b" style={{ borderColor: "#1C2D40" }}>
                  <th className="text-left py-2 pr-4 font-medium">Agent</th>
                  <th className="text-left py-2 pr-4 font-medium">Status</th>
                  <th className="text-right py-2 pr-4 font-medium">Active</th>
                  <th className="text-right py-2 pr-4 font-medium">Trialing</th>
                  <th className="text-right py-2 pr-4 font-medium">Cancelled</th>
                  <th className="text-right py-2 pr-4 font-medium">MRR</th>
                  <th className="text-right py-2 font-medium">Churn</th>
                </tr>
              </thead>
              <tbody>
                {perAgent.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b hover:bg-card/60 transition-colors"
                    style={{ borderColor: "#1C2D40" }}
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/builder/agents/${a.id}`}
                        className="font-bold text-white hover:text-primary transition-colors"
                      >
                        {a.name}
                      </Link>
                      <div className="text-dim mt-0.5">{a.vertical}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="px-2 py-0.5 rounded font-bold text-xs"
                        style={
                          a.status === "live"
                            ? { background: "rgba(46,204,113,0.12)", color: "#2ECC71" }
                            : a.status === "review"
                            ? { background: "rgba(255,149,0,0.12)", color: "#FF9500" }
                            : { background: "rgba(74,101,128,0.15)", color: "#4A6580" }
                        }
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-bold" style={{ color: "#2ECC71" }}>
                      {a.active}
                    </td>
                    <td className="py-3 pr-4 text-right" style={{ color: "#FF9500" }}>
                      {a.trialing}
                    </td>
                    <td className="py-3 pr-4 text-right text-dim">
                      {a.cancelled}
                    </td>
                    <td className="py-3 pr-4 text-right font-bold" style={{ color: "#FF9500" }}>
                      ${(a.mrr / 100).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        style={{
                          color:
                            a.churnRate > 20
                              ? "#E74C3C"
                              : a.churnRate > 10
                              ? "#FF9500"
                              : "#2ECC71",
                        }}
                      >
                        {a.churnRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue model reminder */}
      <div
        className="rounded-xl border p-5 flex flex-wrap items-center justify-between gap-4"
        style={{ background: "rgba(59,158,255,0.04)", borderColor: "rgba(59,158,255,0.2)" }}
      >
        <div>
          <div className="text-xs font-bold text-blue mb-1">Revenue Split</div>
          <p className="text-xs text-dim">
            You keep <strong className="text-green">72.5%</strong> of gross MRR.
            Platform takes <strong className="text-primary">27.5%</strong> to cover
            hosting, support, and payment processing.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-dim">Estimated annual run rate</div>
          <div className="text-xl font-extrabold" style={{ color: "#FF9500" }}>
            ${(currentMrr * 12).toLocaleString()}/yr
          </div>
        </div>
      </div>
    </div>
  );
}
