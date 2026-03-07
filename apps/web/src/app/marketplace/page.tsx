import Link from "next/link";
import Navbar from "@/components/Navbar";

const PLACEHOLDER_AGENTS = [
  {
    name: "Dental Receptionist AI",
    vertical: "Dental Practices",
    icon: "🦷",
    desc: "Handles appointment bookings, insurance queries, and follow-up reminders. Works 24/7 so you don't miss a lead.",
    price: "From $149/mo",
    rating: 4.9,
    reviews: 38,
    color: "#3B9EFF",
    tags: ["Scheduling", "Insurance", "Follow-ups"],
  },
  {
    name: "Real Estate Lead Qualifier",
    vertical: "Real Estate",
    icon: "🏠",
    desc: "Qualifies incoming buyer and seller leads, books viewings, and syncs everything to your CRM automatically.",
    price: "From $199/mo",
    rating: 4.8,
    reviews: 52,
    color: "#2ECC71",
    tags: ["Lead Qualify", "CRM Sync", "Bookings"],
  },
  {
    name: "E-commerce Support Agent",
    vertical: "E-commerce",
    icon: "🛒",
    desc: "Handles order status, returns, product questions, and escalates complex issues to your team — all in real time.",
    price: "From $99/mo",
    rating: 4.7,
    reviews: 91,
    color: "#FF9500",
    tags: ["Returns", "Order Status", "Support"],
  },
  {
    name: "Law Firm Intake Agent",
    vertical: "Law Firms",
    icon: "⚖️",
    desc: "Conducts initial client intake, screens case eligibility, and books consultations — HIPAA-aware.",
    price: "From $299/mo",
    rating: 4.9,
    reviews: 17,
    color: "#9B59B6",
    tags: ["Intake", "Compliance", "Scheduling"],
  },
  {
    name: "Restaurant Reservations AI",
    vertical: "Restaurants",
    icon: "🍽️",
    desc: "Takes reservations via web chat, SMS, or phone. Manages waitlists and sends reminders automatically.",
    price: "From $79/mo",
    rating: 4.6,
    reviews: 44,
    color: "#E74C3C",
    tags: ["Reservations", "SMS", "Reminders"],
  },
  {
    name: "Accounting Client Assistant",
    vertical: "Accounting",
    icon: "📊",
    desc: "Answers common tax questions, collects documents from clients, and keeps your workflow moving between seasons.",
    price: "From $179/mo",
    rating: 4.8,
    reviews: 23,
    color: "#F1C40F",
    tags: ["Documents", "Tax FAQ", "Follow-ups"],
  },
];

const FILTERS = [
  "All Verticals",
  "Dental",
  "Real Estate",
  "E-commerce",
  "Law Firms",
  "Restaurants",
  "Accounting",
  "Healthcare",
  "Fitness",
];

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <Navbar />

      {/* Header */}
      <div className="pt-20 pb-10 px-6 border-b border-border bg-hero-gradient">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs text-primary tracking-widest uppercase mb-3">
            Marketplace
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
            Find Your AI Employee
          </h1>
          <p className="text-sm text-dim max-w-xl leading-relaxed mb-6">
            Expert-built agents for your industry. Subscribe, connect, go live in minutes.
            No code. No deployment. No engineers.
          </p>

          {/* Search bar */}
          <div className="flex gap-3 max-w-xl">
            <div className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-dim shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search agents, verticals, or use cases..."
                className="bg-transparent text-xs text-text-main placeholder-dim outline-none flex-1"
              />
            </div>
            <button className="bg-primary text-black text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              className="text-xs px-3 py-1.5 rounded-md border transition-colors"
              style={
                i === 0
                  ? {
                      background: "rgba(255,149,0,0.15)",
                      borderColor: "rgba(255,149,0,0.5)",
                      color: "#FF9500",
                    }
                  : {
                      background: "transparent",
                      borderColor: "#1C2D40",
                      color: "#4A6580",
                    }
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Agent grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLACEHOLDER_AGENTS.map((agent) => (
            <div
              key={agent.name}
              className="bg-card border border-border rounded-xl p-5 card-hover flex flex-col"
            >
              {/* Agent header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${agent.color}15` }}
                >
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {agent.name}
                  </div>
                  <div className="text-xs text-dim mt-0.5" style={{ color: agent.color }}>
                    {agent.vertical}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-dim leading-relaxed mb-4 flex-1">
                {agent.desc}
              </p>

              {/* Tags */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: `${agent.color}12`,
                      color: agent.color,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <div className="text-xs font-bold text-white">{agent.price}</div>
                  <div className="text-xs text-dim mt-0.5">
                    ⭐ {agent.rating} · {agent.reviews} reviews
                  </div>
                </div>
                <button
                  className="text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: `${agent.color}15`,
                    color: agent.color,
                    border: `1px solid ${agent.color}30`,
                  }}
                >
                  Try Free →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon note */}
        <div className="mt-12 text-center py-10 border border-border rounded-xl bg-card/50">
          <div className="text-2xl mb-3">🚀</div>
          <div className="text-sm font-bold text-white mb-2">More agents coming soon</div>
          <p className="text-xs text-dim max-w-sm mx-auto leading-relaxed mb-4">
            Are you a builder with an agent for a specific vertical? List it here and earn recurring revenue.
          </p>
          <Link
            href="/builders"
            className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:text-primary/80 transition-colors"
          >
            List your agent →
          </Link>
        </div>
      </div>
    </div>
  );
}
