export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function last6Months() {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function fmtMonth(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export default async function BuilderEarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "builder") redirect("/dashboard/buyer");

  const BUILDER_CUT = 0.725; // 72.5%

  // All this builder's agents with subscriptions
  const agents = await prisma.agent.findMany({
    where: { builderId: session.user.id },
    select: {
      id: true,
      name: true,
      vertical: true,
      priceMonthly: true,
      status: true,
      subscriptions: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          currentPeriodEnd: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const months = last6Months();
  const now = new Date();

  // Per-agent earnings summary
  const agentSummaries = agents.map((agent) => {
    const active = agent.subscriptions.filter((s) =>
      ["active", "trialing"].includes(s.status)
    ).length;
    const totalSubs = agent.subscriptions.length;
    const cancelled = agent.subscriptions.filter((s) => s.status === "cancelled").length;
    const grossMrr = (active * agent.priceMonthly) / 100;
    const netMrr = grossMrr * BUILDER_CUT;
    const lifetimeGross =
      (totalSubs * agent.priceMonthly) / 100; // rough: each sub paid at least 1 month
    return {
      ...agent,
      activeSubs: active,
      totalSubs,
      cancelled,
      grossMrr,
      netMrr,
      lifetimeGross,
    };
  });

  // Platform totals
  const totalActiveSubs = agentSummaries.reduce((s, a) => s + a.activeSubs, 0);
  const totalGrossMrr = agentSummaries.reduce((s, a) => s + a.grossMrr, 0);
  const totalNetMrr = totalGrossMrr * BUILDER_CUT;
  const totalLifetime = agentSummaries.reduce((s, a) => s + a.lifetimeGross, 0);

  // Monthly estimated earnings (new subscribers × price × builder cut per month bucket)
  const allSubs = agents.flatMap((a) =>
    a.subscriptions.map((s) => ({ ...s, priceMonthly: a.priceMonthly }))
  );

  const monthlyEarnings: Record<string, number> = {};
  for (const m of months) {
    const [y, mo] = m.split("-").map(Number);
    const endOfMonth = new Date(y, mo, 1);
    const activeThen = allSubs.filter((s) => {
      const created = new Date(s.createdAt);
      const cancelled =
        s.status === "cancelled" ? new Date(s.updatedAt) : null;
      return created < endOfMonth && (!cancelled || cancelled >= endOfMonth);
    });
    const gross = activeThen.reduce((sum, s) => sum + s.priceMonthly, 0) / 100;
    monthlyEarnings[m] = Math.round(gross * BUILDER_CUT);
  }

  const thisMonth = months[5];
  const lastMonth = months[4];
  const earningsThisMonth = monthlyEarnings[thisMonth] ?? 0;
  const earningsLastMonth = monthlyEarnings[lastMonth] ?? 0;
  const delta = earningsThisMonth - earningsLastMonth;

  // Next payout estimate: 1st of next month
  const nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/builder"
          className="text-xs text-dim hover:text-primary transition-colors"
        >
          ← Dashboard
        </Link>
        <h1 className="text-xl font-extrabold text-white mt-2">Earnings</h1>
        <p className="text-xs text-dim mt-1">
          Your 72.5% revenue share · payouts via Stripe Connect on the 1st of each month.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Net MRR",
            value: `$${totalNetMrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            sub: delta !== 0
              ? (delta > 0 ? `+$${delta}` : `-$${Math.abs(delta)}`) + " vs last month"
              : "same as last month",
            color: "#FF9500",
            icon: "💸",
          },
          {
            label: "Active Subscribers",
            value: String(totalActiveSubs),
            sub: `across ${agentSummaries.filter((a) => a.activeSubs > 0).length} agent(s)`,
            color: "#2ECC71",
            icon: "👥",
          },
          {
            label: "Lifetime Gross",
            value: `$${totalLifetime.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            sub: "estimated all-time",
            color: "#9B59B6",
            icon: "🏦",
          },
          {
            label: "Next Payout Est.",
            value: `$${earningsThisMonth.toLocaleString()}`,
            sub: nextPayoutDate,
            color: "#3B9EFF",
            icon: "📅",
          },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim uppercase tracking-wide">{label}</span>
              <span className="text-lg">{icon}</span>
            </div>
            <div className="text-xl font-extrabold mb-0.5" style={{ color }}>{value}</div>
            <div className="text-xs text-dim">{sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly earnings bar chart */}
      <div className="bg-card border border-border rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs font-bold text-white">Monthly Net Earnings</div>
            <div className="text-xs text-dim">last 6 months · after platform fee</div>
          </div>
          <div className="text-sm font-extrabold" style={{ color: "#FF9500" }}>
            ${earningsThisMonth.toLocaleString()}{" "}
            <span className="text-xs font-normal text-dim">this mo.</span>
          </div>
        </div>

        {/* Chart */}
        <div className="flex items-end gap-3 h-24">
          {months.map((m) => {
            const val = monthlyEarnings[m] ?? 0;
            const max = Math.max(...months.map((k) => monthlyEarnings[k] ?? 0), 1);
            const pct = (val / max) * 100;
            const isCurrent = m === thisMonth;
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs text-dim">
                  {val > 0 ? `$${val}` : ""}
                </div>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(pct, val > 0 ? 5 : 1)}%`,
                    background: isCurrent
                      ? "#FF9500"
                      : val > 0
                      ? "rgba(255,149,0,0.4)"
                      : "rgba(74,101,128,0.15)",
                    minHeight: "3px",
                  }}
                />
                <div className="text-xs text-dim">{fmtMonth(m)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-agent breakdown */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-white mb-4">Per-Agent Breakdown</h2>
        {agentSummaries.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed p-10 text-center"
            style={{ borderColor: "#1C2D40" }}
          >
            <p className="text-xs text-dim">No agents yet.</p>
            <Link
              href="/dashboard/builder/agents/new"
              className="inline-block mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Create your first agent →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  className="text-dim border-b"
                  style={{ borderColor: "#1C2D40" }}
                >
                  {["Agent", "Status", "Active Subs", "Gross MRR", "Your Cut (72.5%)", "Churn"].map(
                    (h) => (
                      <th key={h} className="text-left py-2 pr-4 font-medium">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {agentSummaries.map((a) => {
                  const churnPct =
                    a.totalSubs > 0
                      ? Math.round((a.cancelled / a.totalSubs) * 100)
                      : 0;
                  return (
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
                          className="px-2 py-0.5 rounded font-bold"
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
                      <td className="py-3 pr-4 font-bold" style={{ color: "#2ECC71" }}>
                        {a.activeSubs}
                      </td>
                      <td className="py-3 pr-4 text-text-main">
                        ${a.grossMrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 pr-4 font-bold" style={{ color: "#FF9500" }}>
                        ${a.netMrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3">
                        <span
                          style={{
                            color:
                              churnPct > 20
                                ? "#E74C3C"
                                : churnPct > 10
                                ? "#FF9500"
                                : "#2ECC71",
                          }}
                        >
                          {churnPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {agentSummaries.length > 1 && (
                <tfoot>
                  <tr className="border-t" style={{ borderColor: "#1C2D40" }}>
                    <td colSpan={2} className="py-3 pr-4 font-bold text-white">
                      Total
                    </td>
                    <td className="py-3 pr-4 font-bold" style={{ color: "#2ECC71" }}>
                      {totalActiveSubs}
                    </td>
                    <td className="py-3 pr-4 text-text-main font-bold">
                      ${totalGrossMrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 pr-4 font-bold" style={{ color: "#FF9500" }}>
                      ${totalNetMrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Payout info */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "rgba(59,158,255,0.04)",
          borderColor: "rgba(59,158,255,0.2)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue mb-2">Payout Details</div>
            <div className="space-y-1.5 text-xs text-dim">
              <div>
                <span className="text-white">Revenue split:</span> You keep{" "}
                <span className="text-green font-bold">72.5%</span> · Platform
                takes <span className="text-primary font-bold">27.5%</span>
              </div>
              <div>
                <span className="text-white">Payout schedule:</span> Monthly, on
                the 1st · processed via Stripe Connect
              </div>
              <div>
                <span className="text-white">Minimum payout:</span> $10 · amounts
                below this roll over to the next month
              </div>
            </div>
          </div>
          <div
            className="rounded-lg border px-4 py-3 text-center shrink-0"
            style={{ borderColor: "#1C2D40", background: "#0C1520" }}
          >
            <div className="text-xs text-dim mb-1">Next payout estimate</div>
            <div className="text-xl font-extrabold" style={{ color: "#FF9500" }}>
              ${earningsThisMonth.toLocaleString()}
            </div>
            <div className="text-xs text-dim mt-0.5">{nextPayoutDate}</div>
          </div>
        </div>
        <div
          className="mt-4 pt-4 border-t flex items-center gap-3"
          style={{ borderColor: "#1C2D40" }}
        >
          <div
            className="text-xs px-2 py-1 rounded font-bold"
            style={{ background: "rgba(255,149,0,0.1)", color: "#FF9500" }}
          >
            ⚠ Stripe Connect not yet linked
          </div>
          <span className="text-xs text-dim">
            Connect your bank account to receive payouts automatically.
          </span>
          <button
            disabled
            className="text-xs font-bold px-4 py-1.5 rounded-lg opacity-50 cursor-not-allowed ml-auto"
            style={{ background: "rgba(59,158,255,0.15)", color: "#3B9EFF" }}
          >
            Connect Bank →
          </button>
        </div>
      </div>
    </div>
  );
}
