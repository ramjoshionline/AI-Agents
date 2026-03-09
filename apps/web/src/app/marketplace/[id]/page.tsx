import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { TOOLS, PRICING_MODELS } from "@/lib/agentConstants";
import SubscribeButton from "./SubscribeButton";

export const revalidate = 60;

export default async function AgentMarketplacePage({
  params,
}: {
  params: { id: string };
}) {
  const agent = await prisma.agent.findFirst({
    where: { id: params.id, status: "live" },
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      vertical: true,
      tools: true,
      pricingModel: true,
      priceMonthly: true,
      trialDays: true,
      createdAt: true,
      // Never expose systemPrompt; builderId exposed only to link to public profile
      builder: { select: { id: true, name: true } },
    },
  });

  if (!agent) notFound();

  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;
  const isBuyer = session?.user.role === "buyer";
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

  // Check if buyer already has an active/trialing subscription
  const isAlreadySubscribed = isBuyer
    ? !!(await prisma.subscription.findFirst({
        where: {
          buyerId: session!.user.id,
          agentId: agent.id,
          status: { in: ["active", "trialing"] },
        },
      }))
    : false;

  const toolIds: string[] = JSON.parse(agent.tools);
  const agentTools = TOOLS.filter((t) => toolIds.includes(t.id));
  const pricingLabel =
    PRICING_MODELS.find((p) => p.id === agent.pricingModel)?.label ??
    "Flat Monthly";
  const price = (agent.priceMonthly / 100).toFixed(0);
  const priceDisplay = `$${price}/mo`;

  // Group tools by category for display
  const toolsByCategory = agentTools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, typeof TOOLS>
  );

  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-dim mb-8">
          <Link href="/marketplace" className="hover:text-text-main transition-colors">
            Marketplace
          </Link>
          <span>›</span>
          <span className="text-text-main">{agent.name}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT — Main content */}
          <div className="md:col-span-2 space-y-8">
            {/* Hero */}
            <div>
              <span
                className="inline-block text-xs px-2.5 py-1 rounded-lg font-bold mb-4"
                style={{ background: "rgba(59,158,255,0.1)", color: "#3B9EFF" }}
              >
                {agent.vertical}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                {agent.name}
              </h1>
              <p className="text-sm text-dim leading-relaxed mb-2">{agent.tagline}</p>
              <p className="text-xs text-dim">
                By{" "}
                <Link
                  href={`/builders/${agent.builder.id}`}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {agent.builder.name ?? "Verified Builder"}
                </Link>
              </p>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">
                About This Agent
              </h2>
              <div
                className="rounded-xl p-5 border text-sm text-text-main leading-relaxed whitespace-pre-line"
                style={{ borderColor: "#1C2D40", background: "#0C1520" }}
              >
                {agent.description}
              </div>
            </div>

            {/* Integrations */}
            {agentTools.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">
                  Integrations ({agentTools.length})
                </h2>
                <div className="space-y-4">
                  {Object.entries(toolsByCategory).map(([category, tools]) => (
                    <div key={category}>
                      <div className="text-xs text-dim uppercase tracking-wide mb-2">
                        {category}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {tools.map((tool) => (
                          <div
                            key={tool.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                            style={{
                              borderColor: "#1C2D40",
                              background: "#0C1520",
                            }}
                          >
                            <span className="text-base">{tool.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-white">
                                {tool.name}
                              </div>
                              <div className="text-xs text-dim">{tool.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How it works */}
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">
                How It Works
              </h2>
              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    title: "Subscribe",
                    desc: "Choose your plan and start your free trial.",
                    color: "#3B9EFF",
                  },
                  {
                    step: "2",
                    title: "Connect",
                    desc: "Authorize the integrations this agent needs (OAuth, one click).",
                    color: "#FF9500",
                  },
                  {
                    step: "3",
                    title: "Go Live",
                    desc: "Your agent is live and working — no technical setup required.",
                    color: "#2ECC71",
                  },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: `${color}15`, color }}
                    >
                      {step}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{title}</div>
                      <div className="text-xs text-dim mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Pricing card (sticky) */}
          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div
                className="rounded-xl border p-6"
                style={{
                  background: "#0C1520",
                  borderColor: "#1C2D40",
                }}
              >
                {/* Price */}
                <div className="text-center mb-5">
                  <div className="text-3xl font-extrabold text-white">
                    {priceDisplay}
                  </div>
                  <div className="text-xs text-dim mt-1">{pricingLabel}</div>
                  {agent.trialDays > 0 && (
                    <div
                      className="inline-block mt-2 text-xs px-2.5 py-1 rounded font-bold"
                      style={{
                        background: "rgba(46,204,113,0.12)",
                        color: "#2ECC71",
                      }}
                    >
                      {agent.trialDays}-day free trial
                    </div>
                  )}
                </div>

                {/* CTA */}
                <SubscribeButton
                  agentId={agent.id}
                  priceDisplay={priceDisplay}
                  trialDays={agent.trialDays}
                  isAuthenticated={isAuthenticated}
                  isBuyer={isBuyer}
                  isAlreadySubscribed={isAlreadySubscribed}
                  stripeConfigured={stripeConfigured}
                />

                {/* Feature list */}
                <div className="mt-5 space-y-2 text-xs text-dim">
                  {[
                    "Cancel anytime",
                    "No technical setup",
                    "Live in under 5 minutes",
                    `${agentTools.length} integration${agentTools.length !== 1 ? "s" : ""} included`,
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="text-green">✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust badge */}
              <div
                className="rounded-xl border p-4 text-center"
                style={{
                  background: "rgba(59,158,255,0.04)",
                  borderColor: "rgba(59,158,255,0.15)",
                }}
              >
                <div className="text-xs text-blue font-bold mb-1">
                  ✓ Verified Agent
                </div>
                <p className="text-xs text-dim leading-relaxed">
                  Reviewed and approved by our team before listing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
