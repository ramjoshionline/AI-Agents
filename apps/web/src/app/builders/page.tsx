export const dynamic = "force-dynamic";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

const STEPS = [
  {
    step: "01",
    icon: "🔨",
    title: "Build Your Agent",
    desc: "Use our no-code builder or SDK to define what your agent does, what tools it connects to, and what verticals it serves.",
    color: "#3B9EFF",
    detail: "System prompt editor, tool integrations (webhooks, APIs), conversation flow designer, test sandbox.",
  },
  {
    step: "02",
    icon: "💰",
    title: "Set Your Price",
    desc: "You decide the pricing model — monthly subscription, usage-based, one-time, or tiered. We support them all.",
    color: "#FF9500",
    detail: "Flat monthly, per-seat, usage-based (per conversation), or tiered pricing. Stripe handles billing.",
  },
  {
    step: "03",
    icon: "🔍",
    title: "Submit for Review",
    desc: "We run 20+ automated tests, a security scan, and a human QA review. Approval or feedback within 48 hours.",
    color: "#9B59B6",
    detail: "Automated test suite, prompt injection scan, data leak check, compliance review (HIPAA/GDPR if applicable).",
  },
  {
    step: "04",
    icon: "🏪",
    title: "Go Live on Marketplace",
    desc: "Your agent is listed in the relevant vertical(s). You get a builder dashboard with real-time earnings and usage data.",
    color: "#2ECC71",
    detail: "Marketplace listing page, builder earnings dashboard, subscriber count, usage analytics, review scores.",
  },
  {
    step: "05",
    icon: "💸",
    title: "Earn Every Month",
    desc: "For every active subscriber, you receive 70–75% of their monthly payment — automatically, via Stripe Connect.",
    color: "#1ABC9C",
    detail: "Monthly payouts via Stripe Connect. Real-time earnings tracker. Detailed subscriber breakdown.",
  },
];

const FAQS = [
  {
    q: "Do I hand over my source code?",
    a: "No. Your agent runs on our infrastructure, but your system prompts and logic stay encrypted and invisible to buyers. They use the agent — they never see how it's built.",
  },
  {
    q: "How is my revenue share calculated?",
    a: "You keep 70–75% of whatever price you set. The platform retains 25–30% to cover hosting, infrastructure (API calls), payments, and support. You can see the exact split in your builder dashboard.",
  },
  {
    q: "What if a buyer cancels?",
    a: "Payments stop. Your agent instance for that buyer is archived. You're not penalized — you simply stop receiving that subscriber's monthly payment.",
  },
  {
    q: "Can I update my agent after it's live?",
    a: "Yes. You can push updates via the builder dashboard. Minor updates go live immediately. Major changes that affect behavior go through an expedited re-review (usually 24h).",
  },
  {
    q: "What does 'no IP loss' mean exactly?",
    a: "Your system prompts, tool configurations, and agent logic are stored encrypted on our servers. Platform staff cannot read them. Buyers cannot access them. You own them — we just run them.",
  },
];

const EARNINGS_EXAMPLES = [
  { subs: 10, price: 99, take: 70, monthly: 693, annual: 8316 },
  { subs: 50, price: 199, take: 72, monthly: 7164, annual: 85968 },
  { subs: 200, price: 149, take: 73, monthly: 21754, annual: 261048 },
  { subs: 500, price: 299, take: 74, monthly: 110630, annual: 1327560 },
];

export default async function BuildersPage() {
  // Fetch builders who have at least one live agent
  const buildersRaw = await prisma.user.findMany({
    where: {
      role: "builder",
      agents: { some: { status: "live" } },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      agents: {
        where: { status: "live" },
        select: {
          id: true,
          vertical: true,
          subscriptions: {
            where: { status: { in: ["active", "trialing"] } },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const builders = buildersRaw.map((b) => ({
    id: b.id,
    name: b.name ?? "Anonymous Builder",
    initials: (b.name ?? "AB")
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase(),
    liveAgents: b.agents.length,
    totalSubs: b.agents.reduce((sum, a) => sum + a.subscriptions.length, 0),
    verticals: Array.from(new Set(b.agents.map((a) => a.vertical))).slice(0, 2),
    memberSince: new Date(b.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
  }));

  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <Navbar />

      {/* Header */}
      <div className="pt-20 pb-14 px-6 border-b border-border bg-hero-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs text-blue tracking-widest uppercase mb-3">
            For Agent Builders
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Build Once.
            <br />
            <span className="text-blue">Earn Every Month.</span>
          </h1>
          <p className="text-sm text-dim max-w-xl mx-auto leading-relaxed mb-8">
            List your AI agent on the marketplace. Set your own price. We handle
            hosting, payments, and support — you collect 70–75% of every
            subscription, forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue text-black font-bold text-sm px-8 py-3.5 rounded-lg hover:bg-blue/90 transition-colors">
              Apply for Early Access
            </button>
            <Link
              href="/#how-it-works"
              className="bg-card border border-border text-text-main text-sm px-8 py-3.5 rounded-lg hover:border-blue/50 transition-colors"
            >
              See How It Works
            </Link>
          </div>
          <p className="mt-4 text-xs text-dim">
            No upfront cost · IP fully protected · Cancel listing anytime
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* How it works for builders */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="text-xs text-blue tracking-widest uppercase mb-3">
              The Process
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">
              From Build to Payday in 5 Steps
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-7 top-8 bottom-8 w-0.5 bg-border" />

            <div className="space-y-6">
              {STEPS.map(({ step, icon, title, desc, color, detail }) => (
                <div key={step} className="flex gap-6 items-start">
                  {/* Step bubble */}
                  <div
                    className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 border-2"
                    style={{
                      background: `${color}15`,
                      borderColor: `${color}40`,
                    }}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 rounded-xl p-5"
                    style={{
                      background: `${color}06`,
                      border: `1px solid ${color}20`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <span
                          className="text-xs font-bold tracking-widest"
                          style={{ color }}
                        >
                          STEP {step}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">
                          {title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-dim leading-relaxed mb-3">{desc}</p>
                    <div
                      className="text-xs rounded-lg px-4 py-2.5 leading-relaxed"
                      style={{ background: `${color}10`, color: `${color}CC` }}
                    >
                      {detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Earnings calculator (static) */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="text-xs text-primary tracking-widest uppercase mb-3">
              Earnings Potential
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">
              What Could You Earn?
            </h2>
            <p className="text-xs text-dim mt-2">
              Based on your subscriber count and the price you set.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Active Subscribers", "Your Price", "Your Cut", "Monthly Earnings", "Annual Earnings"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-dim uppercase tracking-widest text-xs font-bold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EARNINGS_EXAMPLES.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border hover:bg-card/50 transition-colors"
                  >
                    <td className="px-4 py-4 text-white font-bold">
                      {row.subs.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-text-main">
                      ${row.price}/mo
                    </td>
                    <td className="px-4 py-4 text-primary">{row.take}%</td>
                    <td className="px-4 py-4 text-green font-bold">
                      ${row.monthly.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-green font-extrabold">
                      ${row.annual.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-dim mt-3 text-center">
            * Estimates based on 70–75% revenue share. Actual earnings depend on your pricing and subscriber count.
          </p>
        </div>

        {/* FAQs */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="text-xs text-primary tracking-widest uppercase mb-3">
              FAQ
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">
              Builder Questions, Answered
            </h2>
          </div>
          <div className="space-y-4 max-w-3xl mx-auto">
            {FAQS.map(({ q, a }) => (
              <div
                key={q}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="text-xs font-bold text-white mb-2">Q: {q}</div>
                <div className="text-xs text-dim leading-relaxed border-l-2 border-primary/40 pl-3">
                  {a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meet Our Builders */}
        {builders.length > 0 && (
          <div className="mb-20">
            <div className="text-center mb-10">
              <div className="text-xs text-primary tracking-widest uppercase mb-3">
                Our Community
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Meet Our Builders
              </h2>
              <p className="text-xs text-dim mt-2">
                Verified agents built by independent developers and agencies.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {builders.map((b) => (
                <Link
                  key={b.id}
                  href={`/builders/${b.id}`}
                  className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0"
                      style={{ background: "rgba(59,158,255,0.12)", color: "#3B9EFF" }}
                    >
                      {b.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                        {b.name}
                      </div>
                      <div className="text-xs text-dim">Member since {b.memberSince}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {b.verticals.map((v) => (
                      <span
                        key={v}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(74,101,128,0.15)", color: "#4A6580" }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dim">
                      <span className="font-bold" style={{ color: "#3B9EFF" }}>{b.liveAgents}</span> agent{b.liveAgents !== 1 ? "s" : ""}
                    </span>
                    {b.totalSubs > 0 && (
                      <span className="text-dim">
                        <span className="font-bold" style={{ color: "#2ECC71" }}>{b.totalSubs}</span> subscriber{b.totalSubs !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-primary group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="rounded-xl p-10 text-center border-2"
          style={{
            background: "rgba(59,158,255,0.05)",
            borderColor: "rgba(59,158,255,0.25)",
          }}
        >
          <div className="text-3xl mb-4">👩‍💻</div>
          <h2 className="text-xl font-extrabold text-white mb-3">
            Ready to List Your Agent?
          </h2>
          <p className="text-xs text-dim max-w-md mx-auto leading-relaxed mb-6">
            Early-access builders get priority review, a featured listing slot,
            and direct support from our team during onboarding.
          </p>
          <button className="bg-blue text-black font-bold text-sm px-8 py-3.5 rounded-lg hover:bg-blue/90 transition-colors">
            Apply for Early Access →
          </button>
          <p className="mt-3 text-xs text-dim">
            We review applications within 2 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
