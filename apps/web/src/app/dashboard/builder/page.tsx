import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const STAT_CARDS = [
  {
    label: "Listed Agents",
    value: "0",
    icon: "🤖",
    color: "#3B9EFF",
    note: "published",
  },
  {
    label: "Total Subscribers",
    value: "0",
    icon: "🏢",
    color: "#2ECC71",
    note: "active",
  },
  {
    label: "MRR",
    value: "$0",
    icon: "💸",
    color: "#FF9500",
    note: "monthly recurring",
  },
  {
    label: "This Month",
    value: "$0",
    icon: "📈",
    color: "#9B59B6",
    note: "earned so far",
  },
];

export default async function BuilderDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "builder") redirect("/dashboard/buyer");

  const firstName = session.user.name?.split(" ")[0] || "Builder";

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
            <div
              className="text-2xl font-extrabold mb-0.5"
              style={{ color }}
            >
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
              <button className="text-xs bg-primary/10 border border-primary/30 text-primary font-bold px-4 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                + Create Agent
              </button>
            </div>

            <div
              className="rounded-xl border-2 border-dashed p-10 text-center"
              style={{ borderColor: "#1C2D40" }}
            >
              <div className="text-4xl mb-4">🤖</div>
              <div className="text-sm font-bold text-white mb-2">
                No agents listed yet
              </div>
              <p className="text-xs text-dim leading-relaxed max-w-xs mx-auto mb-6">
                Create your first agent, set your price, and submit for review.
                Once approved, it goes live in the marketplace.
              </p>
              <button className="inline-flex items-center gap-2 bg-blue/10 border border-blue/30 text-blue font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-blue/20 transition-colors">
                Create Your First Agent →
              </button>
            </div>
          </div>

          {/* Earnings Overview (placeholder) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Earnings Overview</h2>
              <span
                className="text-xs px-2 py-0.5 rounded font-bold"
                style={{ background: "rgba(255,149,0,0.1)", color: "#FF9500" }}
              >
                Coming in M6
              </span>
            </div>
            <div
              className="bg-card border border-border rounded-xl p-6 text-center"
            >
              <div
                className="h-32 rounded-lg flex items-center justify-center"
                style={{ background: "#111A28" }}
              >
                <p className="text-xs text-dim">
                  Earnings chart will appear here once you have active subscribers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div>
            <h2 className="text-sm font-bold text-white mb-4">
              Recent Activity
            </h2>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-center py-4">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-xs text-dim leading-relaxed">
                  Subscriber activity and usage data will appear here once your
                  first agent is live.
                </p>
              </div>
            </div>
          </div>

          {/* Builder Quick Actions */}
          <div>
            <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { icon: "🔨", label: "Create New Agent", href: "#", color: "#3B9EFF", badge: "M3" },
                { icon: "📖", label: "Builder Docs", href: "/builders", color: "#2ECC71" },
                { icon: "💸", label: "Payout Settings", href: "#", color: "#FF9500", badge: "M6" },
                { icon: "⚙️", label: "Account Settings", href: "#", color: "#9B59B6", badge: "M7" },
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

          {/* Revenue model reminder */}
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
            { step: "1", title: "Create Agent", desc: "Define behaviour, tools, pricing", milestone: "M3" },
            { step: "2", title: "Test in Sandbox", desc: "Chat with it before submitting", milestone: "M4" },
            { step: "3", title: "Submit for Review", desc: "We QA it within 48h", milestone: "M3" },
            { step: "4", title: "Go Live & Earn", desc: "Listed in marketplace, earn MRR", milestone: "M5" },
          ].map(({ step, title, desc, milestone }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-blue/40 bg-blue/10 flex items-center justify-center text-blue text-xs font-bold shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{title}</div>
                <div className="text-xs text-dim mt-0.5">{desc}</div>
                <div
                  className="text-xs mt-1 font-bold"
                  style={{ color: "#3B9EFF" }}
                >
                  {milestone}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
