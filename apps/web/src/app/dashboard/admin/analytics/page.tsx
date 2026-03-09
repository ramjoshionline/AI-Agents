export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// ─── helpers ──────────────────────────────────────────────────────────────────

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function last12Months() {
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
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short" });
}

function pct(a: number, b: number) {
  if (b === 0) return a > 0 ? "+∞%" : "—";
  const delta = ((a - b) / b) * 100;
  return (delta >= 0 ? "+" : "") + delta.toFixed(0) + "%";
}

// ─── mini bar chart ───────────────────────────────────────────────────────────

function BarChart({
  months,
  data,
  color,
}: {
  months: string[];
  data: Record<string, number>;
  color: string;
}) {
  const values = months.map((m) => data[m] ?? 0);
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-16 w-full">
      {months.map((m, i) => {
        const val = values[i];
        const pctH = max > 0 ? (val / max) * 100 : 0;
        return (
          <div key={m} className="flex-1 flex flex-col items-center relative group">
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${Math.max(pctH, val > 0 ? 5 : 1)}%`,
                background: val > 0 ? color : "rgba(74,101,128,0.2)",
                minHeight: "2px",
              }}
            />
            {val > 0 && (
              <div
                className="absolute bottom-full mb-1 text-xs font-bold px-1.5 py-0.5 rounded
                            opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10"
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/dashboard");

  const months = last12Months();
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // ── User stats ─────────────────────────────────────────────────────────────
  const [totalBuyers, totalBuilders, newBuyersThisMonth, newBuyersLastMonth] =
    await Promise.all([
      prisma.user.count({ where: { role: "buyer" } }),
      prisma.user.count({ where: { role: "builder" } }),
      prisma.user.count({
        where: { role: "buyer", createdAt: { gte: startOfThisMonth } },
      }),
      prisma.user.count({
        where: {
          role: "buyer",
          createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
      }),
    ]);

  // ── Agent stats ────────────────────────────────────────────────────────────
  const [totalLive, totalInReview, totalDraft, totalRejected] = await Promise.all([
    prisma.agent.count({ where: { status: "live" } }),
    prisma.agent.count({ where: { status: "review" } }),
    prisma.agent.count({ where: { status: "draft" } }),
    prisma.agent.count({ where: { status: "rejected" } }),
  ]);

  // ── Subscriptions ──────────────────────────────────────────────────────────
  const allSubs = await prisma.subscription.findMany({
    select: {
      id: true,
      agentId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      agent: { select: { priceMonthly: true, builderId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const activeSubs = allSubs.filter((s) => ["active", "trialing"].includes(s.status));
  const cancelledSubs = allSubs.filter((s) => s.status === "cancelled");

  // MRR = sum of priceMonthly for active+trialing subs
  const grossMrr = activeSubs.reduce((sum, s) => sum + (s.agent?.priceMonthly ?? 0), 0) / 100;
  const platformMrr = grossMrr * 0.275; // platform 27.5%

  // Previous month MRR
  const activeThenLastMonth = allSubs.filter((s) => {
    const created = new Date(s.createdAt);
    const cancelled = s.status === "cancelled" ? new Date(s.updatedAt) : null;
    return created < startOfThisMonth && (!cancelled || cancelled >= startOfThisMonth);
  });
  const grossMrrLastMonth =
    activeThenLastMonth.reduce((sum, s) => sum + (s.agent?.priceMonthly ?? 0), 0) / 100;

  // Monthly new subs chart
  const newSubsByMonth: Record<string, number> = {};
  for (const sub of allSubs) {
    const k = monthKey(new Date(sub.createdAt));
    newSubsByMonth[k] = (newSubsByMonth[k] ?? 0) + 1;
  }

  // Monthly gross MRR chart
  const mrrByMonth: Record<string, number> = {};
  for (const m of months) {
    const [y, mo] = m.split("-").map(Number);
    const endOfMonth = new Date(y, mo, 1);
    const activeThen = allSubs.filter((s) => {
      const created = new Date(s.createdAt);
      const cancelled = s.status === "cancelled" ? new Date(s.updatedAt) : null;
      return created < endOfMonth && (!cancelled || cancelled >= endOfMonth);
    });
    mrrByMonth[m] = Math.round(
      activeThen.reduce((sum, s) => sum + (s.agent?.priceMonthly ?? 0), 0) / 100
    );
  }

  // Monthly new signups
  const signupsByMonth: Record<string, number> = {};
  const allUsers = await prisma.user.findMany({
    where: { role: { in: ["buyer", "builder"] } },
    select: { createdAt: true, role: true },
  });
  for (const u of allUsers) {
    const k = monthKey(new Date(u.createdAt));
    signupsByMonth[k] = (signupsByMonth[k] ?? 0) + 1;
  }

  // ── Top agents by subscriber count ────────────────────────────────────────
  const topAgents = await prisma.agent.findMany({
    where: { status: "live" },
    select: {
      id: true,
      name: true,
      vertical: true,
      priceMonthly: true,
      builder: { select: { name: true } },
      subscriptions: {
        where: { status: { in: ["active", "trialing"] } },
        select: { id: true },
      },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const topAgentsSorted = topAgents
    .map((a) => ({
      ...a,
      subCount: a.subscriptions.length,
      mrr: (a.subscriptions.length * a.priceMonthly) / 100,
      avgRating:
        a.reviews.length > 0
          ? Math.round(
              (a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length) * 10
            ) / 10
          : null,
    }))
    .sort((a, b) => b.subCount - a.subCount)
    .slice(0, 10);

  // ── Recent reviews ─────────────────────────────────────────────────────────
  const recentReviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      buyer: { select: { name: true, email: true } },
      agent: { select: { id: true, name: true } },
    },
  });

  // ── Churn ──────────────────────────────────────────────────────────────────
  const churnRate =
    allSubs.length > 0 ? Math.round((cancelledSubs.length / allSubs.length) * 100) : 0;

  const newSubsThisMonth = newSubsByMonth[months[11]] ?? 0;
  const newSubsLastMonth = newSubsByMonth[months[10]] ?? 0;

  const kpis = [
    {
      label: "Gross MRR",
      value: `$${grossMrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: pct(grossMrr, grossMrrLastMonth) + " vs last month",
      color: "#FF9500",
      icon: "💰",
    },
    {
      label: "Platform Revenue",
      value: `$${platformMrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: "27.5% of gross MRR",
      color: "#9B59B6",
      icon: "📈",
    },
    {
      label: "Active Subscribers",
      value: activeSubs.length.toLocaleString(),
      sub: pct(newSubsThisMonth, newSubsLastMonth) + " new subs vs last mo",
      color: "#2ECC71",
      icon: "👥",
    },
    {
      label: "Total Users",
      value: (totalBuyers + totalBuilders).toLocaleString(),
      sub: `${totalBuyers} buyers · ${totalBuilders} builders`,
      color: "#3B9EFF",
      icon: "🧑‍💻",
    },
    {
      label: "Live Agents",
      value: totalLive.toLocaleString(),
      sub: `${totalInReview} in review · ${totalDraft} draft`,
      color: "#2ECC71",
      icon: "🤖",
    },
    {
      label: "Churn Rate",
      value: `${churnRate}%`,
      sub: `${cancelledSubs.length} cancelled all-time`,
      color: churnRate > 20 ? "#E74C3C" : churnRate > 10 ? "#FF9500" : "#2ECC71",
      icon: "📉",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/admin"
            className="text-xs text-dim hover:text-primary transition-colors"
          >
            ← Admin
          </Link>
          <h1 className="text-xl font-extrabold text-white mt-2">Platform Analytics</h1>
          <p className="text-xs text-dim mt-1">
            Live data · last 12 months
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-lg font-bold"
          style={{ background: "rgba(231,76,60,0.1)", color: "#E74C3C" }}
        >
          Admin Only
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, sub, color, icon }) => (
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
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-white">Gross MRR</div>
              <div className="text-xs text-dim">last 12 months</div>
            </div>
            <div className="text-sm font-extrabold" style={{ color: "#FF9500" }}>
              ${mrrByMonth[months[11]] ?? 0}
            </div>
          </div>
          <BarChart months={months} data={mrrByMonth} color="#FF9500" />
          <ChartLabels months={months} />
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-white">New Subscriptions</div>
              <div className="text-xs text-dim">last 12 months</div>
            </div>
            <div className="text-sm font-extrabold" style={{ color: "#2ECC71" }}>
              {newSubsThisMonth} <span className="text-xs font-normal text-dim">this mo.</span>
            </div>
          </div>
          <BarChart months={months} data={newSubsByMonth} color="#2ECC71" />
          <ChartLabels months={months} />
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-white">New Signups</div>
              <div className="text-xs text-dim">buyers + builders</div>
            </div>
            <div className="text-sm font-extrabold" style={{ color: "#3B9EFF" }}>
              {signupsByMonth[months[11]] ?? 0}{" "}
              <span className="text-xs font-normal text-dim">this mo.</span>
            </div>
          </div>
          <BarChart months={months} data={signupsByMonth} color="#3B9EFF" />
          <ChartLabels months={months} />
        </div>
      </div>

      {/* Agent status breakdown */}
      <div className="grid md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Live", count: totalLive, color: "#2ECC71", bg: "rgba(46,204,113,0.08)" },
          { label: "In Review", count: totalInReview, color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
          { label: "Draft", count: totalDraft, color: "#4A6580", bg: "rgba(74,101,128,0.08)" },
          { label: "Rejected", count: totalRejected, color: "#E74C3C", bg: "rgba(231,76,60,0.08)" },
        ].map(({ label, count, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border p-4 text-center"
            style={{ background: bg, borderColor: `${color}25` }}
          >
            <div className="text-2xl font-extrabold mb-0.5" style={{ color }}>
              {count}
            </div>
            <div className="text-xs text-dim">{label} Agents</div>
          </div>
        ))}
      </div>

      {/* Two-column: top agents + recent reviews */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Top agents */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
            Top Agents by Subscribers
          </h2>
          {topAgentsSorted.length === 0 ? (
            <p className="text-xs text-dim">No live agents yet.</p>
          ) : (
            <div className="space-y-3">
              {topAgentsSorted.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: i < 3 ? "rgba(255,149,0,0.15)" : "rgba(74,101,128,0.15)",
                      color: i < 3 ? "#FF9500" : "#4A6580",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/marketplace/${a.id}`}
                      className="text-xs font-bold text-white hover:text-primary transition-colors truncate block"
                    >
                      {a.name}
                    </Link>
                    <div className="text-xs text-dim truncate">
                      {a.vertical} · by {a.builder.name ?? "Unknown"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold" style={{ color: "#2ECC71" }}>
                      {a.subCount} subs
                    </div>
                    {a.avgRating !== null && (
                      <div className="text-xs text-dim flex items-center gap-0.5 justify-end">
                        <span style={{ color: "#FF9500" }}>★</span>
                        {a.avgRating}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reviews */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
            Recent Reviews
          </h2>
          {recentReviews.length === 0 ? (
            <p className="text-xs text-dim">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((r) => (
                <div
                  key={r.id}
                  className="border-b pb-3 last:border-0 last:pb-0"
                  style={{ borderColor: "#1C2D40" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs" style={{ color: "#FF9500" }}>
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </span>
                      <Link
                        href={`/marketplace/${r.agent.id}`}
                        className="text-xs font-bold text-white hover:text-primary transition-colors truncate"
                      >
                        {r.agent.name}
                      </Link>
                    </div>
                    <span className="text-xs text-dim shrink-0">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-xs text-dim line-clamp-2 pl-1">{r.comment}</p>
                  )}
                  <p className="text-xs text-dim mt-0.5">
                    — {r.buyer.name ?? r.buyer.email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User growth table — new signups this month */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">
            User Growth
          </h2>
          <div className="flex items-center gap-4 text-xs text-dim">
            <span>
              <span className="font-bold" style={{ color: "#2ECC71" }}>{newBuyersThisMonth}</span> new buyers this month
            </span>
            <span>
              <span className="font-bold" style={{ color: "#3B9EFF" }}>{totalBuyers + totalBuilders}</span> total
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Total Buyers", value: totalBuyers, color: "#2ECC71" },
            { label: "Total Builders", value: totalBuilders, color: "#3B9EFF" },
            {
              label: "Buyer/Builder Ratio",
              value: totalBuilders > 0 ? `${(totalBuyers / totalBuilders).toFixed(1)}:1` : "—",
              color: "#9B59B6",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-lg border py-4"
              style={{ borderColor: "#1C2D40", background: "#0C1520" }}
            >
              <div className="text-xl font-extrabold mb-0.5" style={{ color }}>
                {value}
              </div>
              <div className="text-xs text-dim">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
