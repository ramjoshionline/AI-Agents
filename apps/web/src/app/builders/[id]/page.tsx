export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

const TOOL_LABELS: Record<string, string> = {
  slack: "Slack",
  calendly: "Calendly",
  twilio_sms: "Twilio SMS",
  webhook: "Webhook",
  hubspot: "HubSpot",
  gmail: "Gmail",
  google_calendar: "Google Calendar",
};

export default async function BuilderProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const builder = await prisma.user.findFirst({
    where: { id: params.id, role: "builder" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      agents: {
        where: { status: "live" },
        select: {
          id: true,
          name: true,
          tagline: true,
          vertical: true,
          tools: true,
          priceMonthly: true,
          trialDays: true,
          createdAt: true,
          subscriptions: {
            where: { status: { in: ["active", "trialing"] } },
            select: { id: true },
          },
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!builder) notFound();

  const liveAgents = builder.agents;
  if (liveAgents.length === 0) notFound(); // no public profile without live agents

  const totalSubs = liveAgents.reduce((sum, a) => sum + a.subscriptions.length, 0);
  const verticals = Array.from(new Set(liveAgents.map((a) => a.vertical)));
  const memberSince = new Date(builder.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const displayName = builder.name ?? "Anonymous Builder";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <Navbar />

      <div className="pt-20 pb-14 px-6 border-b border-border" style={{ background: "rgba(59,158,255,0.03)" }}>
        <div className="max-w-4xl mx-auto">
          <Link
            href="/builders"
            className="text-xs text-dim hover:text-primary transition-colors mb-6 inline-block"
          >
            ← All Builders
          </Link>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold shrink-0 border-2"
              style={{
                background: "rgba(59,158,255,0.12)",
                borderColor: "rgba(59,158,255,0.3)",
                color: "#3B9EFF",
              }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-xl font-extrabold text-white">{displayName}</h1>
                <span
                  className="text-xs px-2 py-0.5 rounded font-bold"
                  style={{ background: "rgba(46,204,113,0.12)", color: "#2ECC71" }}
                >
                  ✓ Verified Builder
                </span>
              </div>
              <p className="text-xs text-dim mb-3">Member since {memberSince}</p>

              {/* Verticals */}
              <div className="flex flex-wrap gap-1.5">
                {verticals.map((v) => (
                  <span
                    key={v}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "rgba(74,101,128,0.2)", color: "#4A6580" }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-6 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#3B9EFF" }}>
                  {liveAgents.length}
                </div>
                <div className="text-xs text-dim">Live Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#2ECC71" }}>
                  {totalSubs}
                </div>
                <div className="text-xs text-dim">Subscribers</div>
              </div>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="sm:hidden flex gap-6 mt-4">
            <div>
              <span className="text-lg font-extrabold" style={{ color: "#3B9EFF" }}>
                {liveAgents.length}
              </span>
              <span className="text-xs text-dim ml-1">live agents</span>
            </div>
            <div>
              <span className="text-lg font-extrabold" style={{ color: "#2ECC71" }}>
                {totalSubs}
              </span>
              <span className="text-xs text-dim ml-1">subscribers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent grid */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-sm font-bold text-white mb-6">
          Live Agents
          <span className="ml-2 text-dim font-normal">({liveAgents.length})</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {liveAgents.map((agent) => {
            const tools: string[] = JSON.parse(agent.tools || "[]");
            const price = `$${(agent.priceMonthly / 100).toFixed(0)}/mo`;
            const subCount = agent.subscriptions.length;
            const avgRating =
              agent.reviews.length > 0
                ? Math.round(
                    (agent.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
                      agent.reviews.length) *
                      10
                  ) / 10
                : null;

            return (
              <Link
                key={agent.id}
                href={`/marketplace/${agent.id}`}
                className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all block"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors leading-tight">
                    {agent.name}
                  </h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded shrink-0 font-bold"
                    style={{ background: "rgba(74,101,128,0.15)", color: "#4A6580" }}
                  >
                    {agent.vertical}
                  </span>
                </div>

                <p className="text-xs text-dim leading-relaxed mb-4">
                  {agent.tagline}
                </p>

                {/* Tools */}
                {tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tools.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(255,149,0,0.08)", color: "#FF9500" }}
                      >
                        {TOOL_LABELS[t] ?? t}
                      </span>
                    ))}
                    {tools.length > 4 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(74,101,128,0.12)", color: "#4A6580" }}
                      >
                        +{tools.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold" style={{ color: "#FF9500" }}>
                      {price}
                    </span>
                    {agent.trialDays > 0 && (
                      <span className="text-xs text-primary">
                        {agent.trialDays}-day trial
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-dim">
                    {avgRating !== null && (
                      <span className="flex items-center gap-0.5">
                        <span style={{ color: "#FF9500" }}>★</span>
                        <span>{avgRating}</span>
                      </span>
                    )}
                    {subCount > 0 && (
                      <span>
                        <span style={{ color: "#2ECC71" }}>{subCount}</span>{" "}
                        subscriber{subCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-primary group-hover:translate-x-0.5 transition-transform inline-block">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
