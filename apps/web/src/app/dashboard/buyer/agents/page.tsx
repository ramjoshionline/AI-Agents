export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CancelButton from "../CancelButton";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  trialing:   { label: "Trial",      color: "#FF9500", bg: "rgba(255,149,0,0.12)"  },
  active:     { label: "Active",     color: "#2ECC71", bg: "rgba(46,204,113,0.12)" },
  past_due:   { label: "Past Due",   color: "#E74C3C", bg: "rgba(231,76,60,0.12)"  },
  cancelled:  { label: "Cancelled",  color: "#4A6580", bg: "rgba(74,101,128,0.15)" },
  incomplete: { label: "Incomplete", color: "#9B59B6", bg: "rgba(155,89,182,0.12)" },
};

export default async function BuyerAgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "buyer") redirect("/dashboard/builder");

  const subscriptions = await prisma.subscription.findMany({
    where: { buyerId: session.user.id },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          tagline: true,
          vertical: true,
          priceMonthly: true,
          trialDays: true,
          builder: { select: { id: true, name: true } },
          reviews: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = subscriptions.filter((s) =>
    ["active", "trialing"].includes(s.status)
  );
  const past = subscriptions.filter((s) =>
    !["active", "trialing"].includes(s.status)
  );

  const totalSpend = active.reduce(
    (sum, s) => sum + s.agent.priceMonthly,
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/buyer"
            className="text-xs text-dim hover:text-primary transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-extrabold text-white mt-2">My Agents</h1>
          <p className="text-xs text-dim mt-1">
            All your AI agent subscriptions in one place.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="text-xs bg-primary/10 border border-primary/30 text-primary font-bold px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors shrink-0"
        >
          + Add Agent
        </Link>
      </div>

      {/* Summary strip */}
      {active.length > 0 && (
        <div
          className="rounded-xl border p-4 mb-6 flex flex-wrap gap-6"
          style={{ background: "rgba(46,204,113,0.04)", borderColor: "rgba(46,204,113,0.2)" }}
        >
          <div>
            <span className="text-xl font-extrabold" style={{ color: "#2ECC71" }}>
              {active.length}
            </span>
            <span className="text-xs text-dim ml-1">active agent{active.length !== 1 ? "s" : ""}</span>
          </div>
          <div>
            <span className="text-xl font-extrabold" style={{ color: "#FF9500" }}>
              ${(totalSpend / 100).toFixed(0)}
            </span>
            <span className="text-xs text-dim ml-1">/mo total spend</span>
          </div>
          {active.filter((s) => s.status === "trialing").length > 0 && (
            <div>
              <span className="text-xl font-extrabold" style={{ color: "#FF9500" }}>
                {active.filter((s) => s.status === "trialing").length}
              </span>
              <span className="text-xs text-dim ml-1">in free trial</span>
            </div>
          )}
        </div>
      )}

      {/* Active / trialing subscriptions */}
      {active.length === 0 && past.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed p-16 text-center"
          style={{ borderColor: "#1C2D40" }}
        >
          <div className="text-4xl mb-4">🤖</div>
          <div className="text-sm font-bold text-white mb-2">No agents yet</div>
          <p className="text-xs text-dim leading-relaxed max-w-xs mx-auto mb-6">
            Browse the marketplace to find an agent for your industry.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-primary text-black font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse Marketplace →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active */}
          {active.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">
                Active Subscriptions
              </h2>
              <div className="space-y-3">
                {active.map((sub) => (
                  <AgentSubCard key={sub.id} sub={sub} showActions />
                ))}
              </div>
            </div>
          )}

          {/* Past / cancelled */}
          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-dim uppercase tracking-widest mb-3">
                Past Subscriptions
              </h2>
              <div className="space-y-3">
                {past.map((sub) => (
                  <AgentSubCard key={sub.id} sub={sub} showActions={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-card ────────────────────────────────────────────────────────────────

type Sub = {
  id: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  agent: {
    id: string;
    name: string;
    tagline: string;
    vertical: string;
    priceMonthly: number;
    trialDays: number;
    builder: { id: string; name: string | null };
    reviews: { rating: number }[];
  };
};

function AgentSubCard({ sub, showActions }: { sub: Sub; showActions: boolean }) {
  const badge = STATUS_BADGE[sub.status] ?? STATUS_BADGE.active;
  const price = `$${(sub.agent.priceMonthly / 100).toFixed(0)}/mo`;
  const trialEnd = sub.trialEndsAt
    ? new Date(sub.trialEndsAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;
  const periodEnd = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const avgRating =
    sub.agent.reviews.length > 0
      ? Math.round(
          (sub.agent.reviews.reduce((s, r) => s + r.rating, 0) /
            sub.agent.reviews.length) *
            10
        ) / 10
      : null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/marketplace/${sub.agent.id}`}
              className="text-sm font-bold text-white hover:text-primary transition-colors truncate"
            >
              {sub.agent.name}
            </Link>
            <span
              className="text-xs px-2 py-0.5 rounded font-bold shrink-0"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded shrink-0"
              style={{ background: "rgba(74,101,128,0.15)", color: "#4A6580" }}
            >
              {sub.agent.vertical}
            </span>
          </div>
          <p className="text-xs text-dim truncate mb-2">{sub.agent.tagline}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
            <span>{price}</span>
            {avgRating !== null && (
              <span className="flex items-center gap-0.5">
                <span style={{ color: "#FF9500" }}>★</span>
                {avgRating}
              </span>
            )}
            <span>
              by{" "}
              <Link
                href={`/builders/${sub.agent.builder.id}`}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {sub.agent.builder.name ?? "Verified Builder"}
              </Link>
            </span>
            {trialEnd && sub.status === "trialing" && (
              <span className="text-primary">Trial ends {trialEnd}</span>
            )}
            {periodEnd && sub.status === "active" && (
              <span>Renews {periodEnd}</span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/dashboard/buyer/integrations/${sub.id}`}
              className="text-xs border border-border text-dim px-3 py-1.5 rounded-lg hover:border-primary/30 hover:text-primary transition-colors"
            >
              🔌 Connect
            </Link>
            <Link
              href={`/dashboard/buyer/chat/${sub.agent.id}`}
              className="text-xs border border-primary/40 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors font-bold"
            >
              Chat →
            </Link>
            <CancelButton subscriptionId={sub.id} />
          </div>
        )}
      </div>
    </div>
  );
}
