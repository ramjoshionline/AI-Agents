import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const STAT_CARDS = [
  {
    label: "Active Agents",
    value: "0",
    icon: "🤖",
    color: "#2ECC71",
    note: "subscribed",
  },
  {
    label: "Actions Today",
    value: "0",
    icon: "⚡",
    color: "#3B9EFF",
    note: "by your agents",
  },
  {
    label: "Time Saved",
    value: "0h",
    icon: "⏰",
    color: "#FF9500",
    note: "this week",
  },
  {
    label: "Pending Review",
    value: "0",
    icon: "📥",
    color: "#9B59B6",
    note: "need your eye",
  },
];

export default async function BuyerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "buyer") redirect("/dashboard/builder");

  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
          <span className="text-xs text-green font-bold uppercase tracking-wide">
            All Systems Active
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white">
          Good to see you, {firstName} 👋
        </h1>
        <p className="text-sm text-dim mt-1">
          Your AI employee dashboard — check in daily to see what&apos;s been handled for you.
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
        {/* Active Agents */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Your Agents</h2>
            <Link
              href="/marketplace"
              className="text-xs text-primary hover:text-primary/80 transition-colors font-bold"
            >
              + Browse Marketplace
            </Link>
          </div>

          <div
            className="rounded-xl border-2 border-dashed p-10 text-center"
            style={{ borderColor: "#1C2D40" }}
          >
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-sm font-bold text-white mb-2">
              No active agents yet
            </div>
            <p className="text-xs text-dim leading-relaxed max-w-xs mx-auto mb-6">
              Subscribe to an agent from the marketplace and it will appear here
              — ready to work for you 24/7.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-primary text-black font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse AI Agents →
            </Link>
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
                <div className="text-2xl mb-2">📋</div>
                <p className="text-xs text-dim leading-relaxed">
                  Agent activity will stream here once you subscribe to your
                  first agent.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { icon: "🛒", label: "Browse Marketplace", href: "/marketplace", color: "#FF9500" },
                { icon: "🔌", label: "Connect Integrations", href: "#", color: "#3B9EFF", badge: "M9" },
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
        </div>
      </div>

      {/* Onboarding checklist */}
      <div
        className="mt-8 rounded-xl border p-6"
        style={{
          background: "rgba(255,149,0,0.04)",
          borderColor: "rgba(255,149,0,0.2)",
        }}
      >
        <h2 className="text-sm font-bold text-white mb-4">
          🚀 Get started in 3 steps
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Browse Agents", desc: "Find an agent for your industry", done: false, href: "/marketplace" },
            { step: "2", title: "Subscribe", desc: "Click subscribe — go live instantly", done: false, href: "/marketplace" },
            { step: "3", title: "Check Daily", desc: "Come back here to see what it handled", done: false, href: "#" },
          ].map(({ step, title, desc, href }) => (
            <Link
              key={step}
              href={href}
              className="flex items-start gap-3 group"
            >
              <div className="w-6 h-6 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                  {title}
                </div>
                <div className="text-xs text-dim mt-0.5">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
