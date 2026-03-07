import Link from "next/link";
import Navbar from "@/components/Navbar";

// ─── Data ────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    icon: "👩‍💻",
    role: "Builder",
    analogy: "Like a Shopify App Developer",
    color: "#3B9EFF",
    border: "rgba(59,158,255,0.25)",
    bg: "rgba(59,158,255,0.05)",
    steps: [
      "Build an agent using our SDK or no-code builder",
      "Set your own price — subscription, usage, or one-time",
      "Submit for review & quality check",
      "Earn recurring revenue every month it's active",
    ],
    cta: { label: "Start Building", href: "/builders" },
  },
  {
    icon: "🏗️",
    role: "Platform",
    analogy: "Like Shopify",
    color: "#FF9500",
    border: "rgba(255,149,0,0.25)",
    bg: "rgba(255,149,0,0.05)",
    steps: [
      "Hosts every agent on managed infrastructure",
      "Reviews agent quality, security & compliance",
      "Handles all payments and revenue splits",
      "Provides the buyer dashboard & embed surfaces",
    ],
    cta: null,
  },
  {
    icon: "🏢",
    role: "Buyer (SMB)",
    analogy: "Like a Shopify Merchant",
    color: "#2ECC71",
    border: "rgba(46,204,113,0.25)",
    bg: "rgba(46,204,113,0.05)",
    steps: [
      "Browse vertical-specific agents for your industry",
      "Subscribe — no code, no servers, no engineers",
      "Connect your tools via OAuth in 5 minutes",
      "Use a live dashboard daily — like your bank app",
    ],
    cta: { label: "Browse Agents", href: "/marketplace" },
  },
];

const VERTICALS = [
  { name: "Dental Practices", icon: "🦷", agents: 12, color: "#3B9EFF" },
  { name: "Law Firms", icon: "⚖️", agents: 8, color: "#9B59B6" },
  { name: "Real Estate", icon: "🏠", agents: 15, color: "#2ECC71" },
  { name: "E-commerce", icon: "🛒", agents: 22, color: "#FF9500" },
  { name: "Restaurants", icon: "🍽️", agents: 10, color: "#E74C3C" },
  { name: "Healthcare", icon: "🏥", agents: 9, color: "#1ABC9C" },
  { name: "Accounting", icon: "📊", agents: 7, color: "#F1C40F" },
  { name: "Fitness & Wellness", icon: "💪", agents: 11, color: "#3B9EFF" },
];

const SURFACES = [
  {
    emoji: "🖥️",
    title: "Control Dashboard",
    desc: "Activity log, performance metrics, settings, and override inbox. Check it daily — like Slack.",
    color: "#3B9EFF",
    sticky: "Very High",
  },
  {
    emoji: "💬",
    title: "Customer-Facing Widget",
    desc: "Chat widget on your website, SMS number, email inbox. Your customers talk to the agent — you watch it work.",
    color: "#2ECC71",
    sticky: "Extremely High",
  },
  {
    emoji: "🔌",
    title: "Integration Sync",
    desc: "Leads auto-logged to your CRM, appointments booked in your calendar, invoices triggered — silently.",
    color: "#FF9500",
    sticky: "Extremely High",
  },
];

const STATS = [
  { val: "500+", label: "Agents Available" },
  { val: "12", label: "Industry Verticals" },
  { val: "70%", label: "Builder Revenue Share" },
  { val: "~5min", label: "Avg. Onboarding Time" },
];

const FEATURES = [
  {
    icon: "🔒",
    title: "Builder IP Protected",
    desc: "Your agent logic never leaves the platform. Buyers use the agent — they never see your prompts or code.",
    color: "#3B9EFF",
  },
  {
    icon: "⚡",
    title: "One-Click Activation",
    desc: "Buyers browse, subscribe, and go live in minutes. No deployment, no engineers, no friction.",
    color: "#2ECC71",
  },
  {
    icon: "💸",
    title: "You Set the Price",
    desc: "Builders control pricing — monthly subscriptions, usage-based, or tiered. Platform takes a fair % cut.",
    color: "#FF9500",
  },
  {
    icon: "📊",
    title: "Live Agent Dashboard",
    desc: "Every buyer gets a dashboard showing what their agent did, handled, and saved — like an AI time-sheet.",
    color: "#9B59B6",
  },
  {
    icon: "🔌",
    title: "Deep Integrations",
    desc: "OAuth connectors for Gmail, Calendly, HubSpot, QuickBooks, and more. Agent writes to tools buyers already use.",
    color: "#1ABC9C",
  },
  {
    icon: "🛡️",
    title: "Quality Reviewed",
    desc: "Every agent passes automated tests, security scans, and human QA before going live in the marketplace.",
    color: "#F1C40F",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden grid-bg">
        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,149,0,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            <span className="text-xs text-dim tracking-widest uppercase">
              AI Agent Marketplace · Open Beta
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Hire Your AI Employee.
            <br />
            <span className="gradient-text">No Code. No Servers.</span>
            <br />
            No Engineers.
          </h1>

          <p className="text-sm md:text-base text-dim leading-relaxed max-w-2xl mx-auto mb-10">
            The marketplace where SMBs subscribe to expert-built AI agents — and
            where builders earn recurring revenue from agents they&apos;ve already
            built. Everyone wins.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-black font-bold text-sm px-8 py-3.5 rounded-lg hover:bg-primary/90 transition-all glow-primary"
            >
              Browse AI Agents
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/builders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-card border border-border text-text-main text-sm px-8 py-3.5 rounded-lg hover:border-primary/50 hover:text-primary transition-all"
            >
              List Your Agent →
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-xs text-dim">
            Agents for dental, legal, real estate, e-commerce and 8 more verticals
          </p>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/50 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ val, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-primary mb-1">
                {val}
              </div>
              <div className="text-xs text-dim tracking-wide uppercase">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-primary tracking-widest uppercase mb-3">
              How It Works
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Three Players. One Ecosystem.
            </h2>
            <p className="text-sm text-dim mt-3 max-w-xl mx-auto leading-relaxed">
              Builders supply the expertise. The platform handles hosting and
              payments. Buyers get a live AI employee — like subscribing to
              Calendly or Intercom.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map(({ icon, role, analogy, color, border, bg, steps, cta }) => (
              <div
                key={role}
                className="rounded-xl p-6 card-hover"
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                }}
              >
                <div className="text-4xl mb-4">{icon}</div>
                <div
                  className="text-sm font-bold mb-1"
                  style={{ color }}
                >
                  {role}
                </div>
                <div className="text-xs text-dim italic mb-5">{analogy}</div>

                <ul className="space-y-3 mb-6">
                  {steps.map((step) => (
                    <li key={step} className="flex items-start gap-2 text-xs text-text-main leading-relaxed">
                      <span style={{ color }} className="mt-0.5 shrink-0">▸</span>
                      {step}
                    </li>
                  ))}
                </ul>

                {cta && (
                  <Link
                    href={cta.href}
                    className="inline-flex items-center gap-1 text-xs font-bold transition-colors"
                    style={{ color }}
                  >
                    {cta.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Shopify analogy callout */}
          <div
            className="mt-8 rounded-xl p-6 text-center border"
            style={{ background: "rgba(255,149,0,0.05)", borderColor: "rgba(255,149,0,0.2)" }}
          >
            <p className="text-sm text-text-main leading-relaxed">
              <span className="text-primary font-bold">The mental model:</span>{" "}
              Think Shopify App Store. Thousands of app developers (builders), one
              unified hosting platform (us), merchants just click Install and
              their store gets superpowers. That&apos;s AgentMarket — for AI.
            </p>
          </div>
        </div>
      </section>

      {/* ── Agent Verticals ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-primary tracking-widest uppercase mb-3">
              Industry Verticals
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Agents Built for Your Industry
            </h2>
            <p className="text-sm text-dim mt-3 max-w-xl mx-auto">
              Not generic chatbots. Specialized agents that know your workflows,
              compliance needs, and customer expectations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {VERTICALS.map(({ name, icon, agents, color }) => (
              <Link
                key={name}
                href="/marketplace"
                className="group bg-card border border-border rounded-xl p-5 text-center card-hover"
                style={{ "--hover-color": color } as React.CSSProperties}
              >
                <div className="text-3xl mb-3">{icon}</div>
                <div className="text-xs font-bold text-text-main group-hover:text-white transition-colors mb-1">
                  {name}
                </div>
                <div className="text-xs text-dim">
                  <span style={{ color }}>{agents}</span> agents
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-bold"
            >
              View all verticals →
            </Link>
          </div>
        </div>
      </section>

      {/* ── What Buyers Get (3 Surfaces) ─────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-primary tracking-widest uppercase mb-3">
              What You Get
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Not a Chatbot. An AI Employee.
            </h2>
            <p className="text-sm text-dim mt-3 max-w-xl mx-auto leading-relaxed">
              When you subscribe, you get three live surfaces. All hosted by us.
              Zero code required. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {SURFACES.map(({ emoji, title, desc, color, sticky }) => (
              <div
                key={title}
                className="rounded-xl p-6 card-hover"
                style={{
                  background: `${color}08`,
                  border: `1px solid ${color}25`,
                }}
              >
                <div className="text-4xl mb-4">{emoji}</div>
                <div
                  className="text-sm font-bold mb-2"
                  style={{ color }}
                >
                  {title}
                </div>
                <p className="text-xs text-dim leading-relaxed mb-4">{desc}</p>
                <div
                  className="text-xs font-bold px-3 py-1.5 rounded-md inline-block"
                  style={{ background: `${color}15`, color }}
                >
                  Stickiness: {sticky}
                </div>
              </div>
            ))}
          </div>

          {/* The key callout */}
          <div
            className="rounded-xl p-6 border-2"
            style={{
              background: "rgba(46,204,113,0.05)",
              borderColor: "rgba(46,204,113,0.3)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl shrink-0">⭐</div>
              <div>
                <div className="text-sm font-bold text-green mb-2">
                  The Most Important Part: The Dashboard
                </div>
                <p className="text-xs text-text-main leading-relaxed">
                  The buyer&apos;s dashboard is the product. Every morning they open
                  it and see: &quot;Your agent handled 14 inquiries, booked 3
                  appointments, and saved you 4.5 hours last night.&quot; Not a
                  file. Not an API. A persistent, live service panel — like
                  their online banking app, but for their AI employee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Features ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-primary tracking-widest uppercase mb-3">
              Platform Features
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Built for Both Sides of the Marketplace
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-xl p-5 card-hover"
              >
                <div className="text-2xl mb-3">{icon}</div>
                <div
                  className="text-xs font-bold mb-2"
                  style={{ color }}
                >
                  {title}
                </div>
                <p className="text-xs text-dim leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Revenue Model (For Builders) ─────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-primary tracking-widest uppercase mb-3">
              For Builders
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Build Once. Earn Every Month.
            </h2>
            <p className="text-sm text-dim mt-3 max-w-xl mx-auto leading-relaxed">
              You set the price. You keep the majority. We handle hosting,
              payments, and distribution. No infrastructure headaches.
            </p>
          </div>

          {/* Revenue flow */}
          <div
            className="rounded-xl p-8 border mb-10"
            style={{
              background: "rgba(255,149,0,0.04)",
              borderColor: "rgba(255,149,0,0.2)",
            }}
          >
            <div className="text-xs text-dim text-center uppercase tracking-widest mb-8">
              Revenue Flow Example
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 text-center">
              {[
                {
                  icon: "🏢",
                  label: "Buyer Pays",
                  val: "Your price",
                  note: "e.g. $199/mo",
                  color: "#2ECC71",
                },
                { arrow: true },
                {
                  icon: "🏗️",
                  label: "Platform Fee",
                  val: "~25–30%",
                  note: "hosting + ops",
                  color: "#FF9500",
                },
                { arrow: true },
                {
                  icon: "👩‍💻",
                  label: "You Receive",
                  val: "~70–75%",
                  note: "via Stripe",
                  color: "#3B9EFF",
                },
              ].map((item, i) =>
                "arrow" in item ? (
                  <div key={i} className="text-dim text-xl sm:px-4 rotate-90 sm:rotate-0">
                    →
                  </div>
                ) : (
                  <div
                    key={item.label}
                    className="rounded-xl px-6 py-5 min-w-32"
                    style={{
                      background: `${item.color}10`,
                      border: `1px solid ${item.color}25`,
                    }}
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div
                      className="text-xs font-bold mb-1"
                      style={{ color: item.color }}
                    >
                      {item.label}
                    </div>
                    <div className="text-lg font-extrabold text-white mb-0.5">
                      {item.val}
                    </div>
                    <div className="text-xs text-dim">{item.note}</div>
                  </div>
                )
              )}
            </div>

            <div
              className="mt-8 rounded-lg px-5 py-4 text-xs text-text-main leading-relaxed text-center"
              style={{ background: "rgba(255,149,0,0.08)" }}
            >
              <span className="text-primary font-bold">
                At 100 active subscribers at $199/mo:
              </span>{" "}
              You earn ~$13,900–$14,900/mo in passive income. We handle every
              server, payment, and support ticket.
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/builders"
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary font-bold text-sm px-8 py-3.5 rounded-lg hover:bg-primary/20 transition-all"
            >
              Start Building →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Buyer CTA */}
            <div
              className="rounded-xl p-8 text-center"
              style={{
                background: "rgba(46,204,113,0.06)",
                border: "1px solid rgba(46,204,113,0.25)",
              }}
            >
              <div className="text-4xl mb-4">🏢</div>
              <div className="text-green font-bold text-sm mb-2 uppercase tracking-wide">
                For SMBs
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">
                Your AI Employee Is Waiting
              </h3>
              <p className="text-xs text-dim leading-relaxed mb-6">
                Browse agents built specifically for your industry. Subscribe,
                connect your tools, go live in minutes.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 bg-green/10 border border-green/30 text-green font-bold text-sm px-6 py-3 rounded-lg hover:bg-green/20 transition-all w-full justify-center"
              >
                Browse the Marketplace →
              </Link>
            </div>

            {/* Builder CTA */}
            <div
              className="rounded-xl p-8 text-center"
              style={{
                background: "rgba(59,158,255,0.06)",
                border: "1px solid rgba(59,158,255,0.25)",
              }}
            >
              <div className="text-4xl mb-4">👩‍💻</div>
              <div className="text-blue font-bold text-sm mb-2 uppercase tracking-wide">
                For Builders
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">
                Turn Your Agent Into MRR
              </h3>
              <p className="text-xs text-dim leading-relaxed mb-6">
                List your agent, set your price, keep 70–75% of every
                subscription. We handle the rest.
              </p>
              <Link
                href="/builders"
                className="inline-flex items-center gap-2 bg-blue/10 border border-blue/30 text-blue font-bold text-sm px-6 py-3 rounded-lg hover:bg-blue/20 transition-all w-full justify-center"
              >
                List Your Agent →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold">
              A
            </div>
            <span className="text-xs font-bold text-white">
              Agent<span className="text-primary">Market</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { label: "Marketplace", href: "/marketplace" },
              { label: "For Builders", href: "/builders" },
              { label: "How It Works", href: "/#how-it-works" },
              { label: "Pricing", href: "/#pricing" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs text-dim hover:text-text-main transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="text-xs text-dim">
            © 2026 AgentMarket · AI Agent Marketplace
          </div>
        </div>
      </footer>
    </div>
  );
}
