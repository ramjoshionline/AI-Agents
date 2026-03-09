export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import MarketplaceClient from "./MarketplaceClient";

export const revalidate = 60;

export default async function MarketplacePage() {
  const agents = await prisma.agent.findMany({
    where: { status: "live" },
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
      reviews: { select: { rating: true } },
      subscriptions: {
        where: { status: { in: ["active", "trialing"] } },
        select: { id: true },
      },
      featured: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const agentsWithRating = agents.map(({ reviews, subscriptions, ...rest }) => ({
    ...rest,
    avgRating:
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null,
    reviewCount: reviews.length,
    subCount: subscriptions.length,
  }));

  const totalAgents = agentsWithRating.length;
  const verticalCount = Array.from(new Set(agentsWithRating.map((a) => a.vertical))).length;
  const avgPrice =
    totalAgents > 0
      ? Math.round(
          agentsWithRating.reduce((sum, a) => sum + a.priceMonthly, 0) / totalAgents / 100
        )
      : 0;

  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <Navbar />

      {/* Hero */}
      <div className="pt-20 pb-12 border-b border-border bg-hero-gradient">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue/10 border border-blue/20 rounded-full px-4 py-1.5 text-xs text-blue font-bold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
            AI Agent Marketplace
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Find Your AI Employee
          </h1>
          <p className="text-sm text-dim max-w-lg mx-auto leading-relaxed mb-8">
            Expert-built agents for your industry. Subscribe, connect, go live
            in minutes. No code. No deployment.
          </p>

          {totalAgents > 0 && (
            <div className="flex items-center justify-center gap-10">
              {[
                { label: "Live Agents", value: String(totalAgents) },
                { label: "Industries", value: String(verticalCount) },
                { label: "Avg. Price", value: `$${avgPrice}/mo` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-extrabold text-primary">{value}</div>
                  <div className="text-xs text-dim">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Listing */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <MarketplaceClient agents={agentsWithRating} />
      </div>

      {/* Builder CTA */}
      <div className="border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="text-xl font-extrabold text-white mb-2">
            Build the next agent
          </div>
          <p className="text-sm text-dim mb-6 max-w-md mx-auto">
            Create an agent for your niche, set your price, and earn 70–75% of
            every subscription — we handle billing, hosting, and support.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/builders"
              className="text-xs border border-border text-dim hover:text-text-main px-6 py-2.5 rounded-lg transition-colors"
            >
              Learn more
            </Link>
            <Link
              href="/sign-up?role=builder"
              className="text-xs bg-primary text-black font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Building →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
