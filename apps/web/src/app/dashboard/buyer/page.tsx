import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CancelButton from "./CancelButton";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  trialing: { label: "Trial", color: "#FF9500", bg: "rgba(255,149,0,0.12)" },
  active: { label: "Active", color: "#2ECC71", bg: "rgba(46,204,113,0.12)" },
  past_due: { label: "Past Due", color: "#E74C3C", bg: "rgba(231,76,60,0.12)" },
  cancelled: { label: "Cancelled", color: "#4A6580", bg: "rgba(74,101,128,0.15)" },
  incomplete: { label: "Incomplete", color: "#9B59B6", bg: "rgba(155,89,182,0.12)" },
};

export default async function BuyerDashboardPage({
  searchParams,
}: {
  searchParams: { subscribed?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "buyer") redirect("/dashboard/builder");

  const firstName = session.user.name?.split(" ")[0] || "there";

  const subscriptions = await prisma.subscription.findMany({
    where: { buyerId: session.user.id },
    include: { agent: { select: { id: true, name: true, tagline: true, vertical: true, priceMonthly: true, trialDays: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activeCount = subscriptions.filter((s) =>
    ["active", "trialing"].includes(s.status)
  ).length;

  const totalSpend = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.agent.priceMonthly, 0);

  const justSubscribed = searchParams.subscribed
    ? subscriptions.find((s) => s.agent.id === searchParams.subscribed)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: activeCount > 0 ? "#2ECC71" : "#4A6580" }}
          />
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: activeCount > 0 ? "#2ECC71" : "#4A6580" }}
          >
            {activeCount > 0 ? "Agents Active" : "No Active Agents"}
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white">
          Good to see you, {firstName} 👋
        </h1>
        <p className="text-sm text-dim mt-1">
          Your AI employee dashboard — manage subscriptions and track activity.
        </p>
      </div>

      {/* Success banner after subscribing */}
      {justSubscribed && (
        <div
          className="rounded-xl border p-5 mb-6"
          style={{
            background: "rgba(46,204,113,0.08)",
            borderColor: "rgba(46,204,113,0.3)",
          }}
        >
          <div className="text-sm font-bold text-green mb-1">
            🎉 You&apos;re subscribed to {justSubscribed.agent.name}!
          </div>
          <p className="text-xs text-dim">
            {justSubscribed.status === "trialing"
              ? `Your ${justSubscribed.agent.trialDays}-day free trial has started. We'll remind you before billing begins.`
              : "Your subscription is active. Your agent is ready to go."}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Agents", value: String(activeCount), icon: "🤖", color: "#2ECC71", note: "subscribed" },
          { label: "Monthly Spend", value: activeCount > 0 ? `$${(totalSpend / 100).toFixed(0)}/mo` : "$0", icon: "💸", color: "#FF9500", note: "billed monthly" },
          { label: "Messages Sent", value: "—", icon: "💬", color: "#3B9EFF", note: "per-session" },
          { label: "Time Saved", value: "—", icon: "⏰", color: "#9B59B6", note: "coming soon" },
        ].map(({ label, value, icon, color, note }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim uppercase tracking-wide">{label}</span>
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
        {/* Subscriptions */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Your Subscriptions</h2>
            <Link
              href="/marketplace"
              className="text-xs bg-primary/10 border border-primary/30 text-primary font-bold px-4 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
            >
              + Add Agent
            </Link>
          </div>

          {subscriptions.length === 0 ? (
            <div
              className="rounded-xl border-2 border-dashed p-12 text-center"
              style={{ borderColor: "#1C2D40" }}
            >
              <div className="text-4xl mb-4">🤖</div>
              <div className="text-sm font-bold text-white mb-2">
                No subscriptions yet
              </div>
              <p className="text-xs text-dim leading-relaxed max-w-xs mx-auto mb-6">
                Subscribe to an agent from the marketplace and it will appear
                here, ready to work for you 24/7.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 bg-primary text-black font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse AI Agents →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const badge = STATUS_BADGE[sub.status] ?? STATUS_BADGE.active;
                const price = `$${(sub.agent.priceMonthly / 100).toFixed(0)}/mo`;
                const periodEnd = sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;
                const trialEnd = sub.trialEndsAt
                  ? new Date(sub.trialEndsAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : null;

                return (
                  <div
                    key={sub.id}
                    className="bg-card border border-border rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold text-white truncate">
                            {sub.agent.name}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded font-bold shrink-0"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-dim truncate mb-2">
                          {sub.agent.tagline}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
                          <span>{sub.agent.vertical}</span>
                          <span>{price}</span>
                          {trialEnd && sub.status === "trialing" && (
                            <span className="text-primary">
                              Trial ends {trialEnd}
                            </span>
                          )}
                          {periodEnd && sub.status === "active" && (
                            <span>Renews {periodEnd}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Integrations */}
                        {["active", "trialing"].includes(sub.status) && (
                          <Link
                            href={`/dashboard/buyer/integrations/${sub.id}`}
                            className="text-xs border border-border text-dim px-3 py-1.5 rounded-lg hover:border-primary/30 hover:text-primary transition-colors"
                          >
                            🔌 Connect
                          </Link>
                        )}

                        {/* Chat */}
                        {["active", "trialing"].includes(sub.status) ? (
                          <Link
                            href={`/dashboard/buyer/chat/${sub.agent.id}`}
                            className="text-xs border border-primary/40 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors font-bold"
                          >
                            Chat →
                          </Link>
                        ) : (
                          <span className="text-xs border border-border text-dim px-3 py-1.5 rounded-lg opacity-40 cursor-not-allowed">
                            Chat
                          </span>
                        )}

                        {/* Cancel */}
                        {["active", "trialing"].includes(sub.status) && (
                          <CancelButton subscriptionId={sub.id} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { icon: "🛒", label: "Browse Marketplace", href: "/marketplace", color: "#FF9500", badge: null },
                { icon: "🔌", label: "Connect Integrations", href: subscriptions[0] ? `/dashboard/buyer/integrations/${subscriptions[0].id}` : "#", color: "#3B9EFF", badge: null },
                { icon: "💬", label: "Chat with Agent", href: "#chat", color: "#2ECC71", badge: null },
                { icon: "⚙️", label: "Account Settings", href: "#", color: "#9B59B6", badge: "Soon" },
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

          {/* Stripe test info */}
          {process.env.NODE_ENV !== "production" && (
            <div
              className="rounded-xl border p-4"
              style={{
                background: "rgba(255,149,0,0.04)",
                borderColor: "rgba(255,149,0,0.2)",
              }}
            >
              <div className="text-xs font-bold text-primary mb-2">
                🧪 Test Mode
              </div>
              <div className="text-xs text-dim space-y-1">
                <div>Use card: <code className="font-mono text-text-main">4242 4242 4242 4242</code></div>
                <div>Expiry: any future date</div>
                <div>CVC: any 3 digits</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding */}
      {subscriptions.length === 0 && (
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
              { step: "1", title: "Browse Agents", desc: "Find one for your industry", href: "/marketplace" },
              { step: "2", title: "Subscribe", desc: "Click subscribe — billing via Stripe", href: "/marketplace" },
              { step: "3", title: "Go Live", desc: "Agent is ready to work immediately", href: "#" },
            ].map(({ step, title, desc, href }) => (
              <Link key={step} href={href} className="flex items-start gap-3 group">
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
      )}
    </div>
  );
}
