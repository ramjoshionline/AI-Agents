"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { VERTICALS, TOOLS } from "@/lib/agentConstants";

type Agent = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  vertical: string;
  tools: string; // JSON string
  pricingModel: string;
  priceMonthly: number;
  trialDays: number;
  avgRating: number | null;
  reviewCount: number;
};

function AgentCard({ agent }: { agent: Agent }) {
  const toolIds: string[] = JSON.parse(agent.tools);
  const toolObjects = TOOLS.filter((t) => toolIds.includes(t.id));
  const price = (agent.priceMonthly / 100).toFixed(0);

  return (
    <Link
      href={`/marketplace/${agent.id}`}
      className="group bg-card border border-border rounded-xl p-6 flex flex-col card-hover"
    >
      {/* Vertical badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs px-2.5 py-1 rounded-lg font-bold"
          style={{ background: "rgba(59,158,255,0.1)", color: "#3B9EFF" }}
        >
          {agent.vertical}
        </span>
        {agent.trialDays > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded font-bold"
            style={{ background: "rgba(46,204,113,0.12)", color: "#2ECC71" }}
          >
            {agent.trialDays}-day trial
          </span>
        )}
      </div>

      {/* Name + tagline */}
      <h3 className="text-sm font-extrabold text-white mb-1.5 group-hover:text-primary transition-colors">
        {agent.name}
      </h3>
      <p className="text-xs text-dim leading-relaxed line-clamp-2 mb-4 flex-1">
        {agent.tagline}
      </p>

      {/* Tools */}
      {toolObjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {toolObjects.slice(0, 4).map((t) => (
            <span
              key={t.id}
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: "#0C1520", color: "#4A6580" }}
            >
              {t.icon} {t.name}
            </span>
          ))}
          {toolObjects.length > 4 && (
            <span className="text-xs text-dim">+{toolObjects.length - 4} more</span>
          )}
        </div>
      )}

      {/* Price + CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <span className="text-lg font-extrabold text-primary">${price}</span>
          <span className="text-xs text-dim">/mo</span>
        </div>
        <div className="flex items-center gap-2">
          {agent.avgRating !== null && (
            <span className="text-xs text-dim flex items-center gap-0.5">
              <span style={{ color: "#FF9500" }}>★</span>
              {agent.avgRating}
              <span className="text-dim/60">({agent.reviewCount})</span>
            </span>
          )}
          <span className="text-xs text-blue group-hover:text-primary transition-colors font-bold">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketplaceClient({ agents }: { agents: Agent[] }) {
  const [search, setSearch] = useState("");
  const [activeVertical, setActiveVertical] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = agents;
    if (activeVertical) {
      list = list.filter((a) => a.vertical === activeVertical);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tagline.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [agents, activeVertical, search]);

  // Only show verticals that have at least one agent
  const availableVerticals = useMemo(() => {
    const seen: Record<string, true> = {};
    const list: string[] = [];
    for (const a of agents) {
      if (!seen[a.vertical]) {
        seen[a.vertical] = true;
        list.push(a.vertical);
      }
    }
    return list.sort();
  }, [agents]);

  return (
    <div>
      {/* Search + filter bar */}
      <div className="mb-8">
        <div className="relative mb-5">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, capability, or description…"
            className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-main placeholder-dim outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Vertical pills */}
        {availableVerticals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveVertical(null)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all font-bold"
              style={
                activeVertical === null
                  ? {
                      background: "rgba(255,149,0,0.12)",
                      borderColor: "rgba(255,149,0,0.4)",
                      color: "#FF9500",
                    }
                  : { borderColor: "#1C2D40", color: "#4A6580" }
              }
            >
              All ({agents.length})
            </button>
            {availableVerticals.map((v) => {
              const count = agents.filter((a) => a.vertical === v).length;
              return (
                <button
                  key={v}
                  onClick={() =>
                    setActiveVertical(activeVertical === v ? null : v)
                  }
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                  style={
                    activeVertical === v
                      ? {
                          background: "rgba(255,149,0,0.12)",
                          borderColor: "rgba(255,149,0,0.4)",
                          color: "#FF9500",
                          fontWeight: "bold",
                        }
                      : { borderColor: "#1C2D40", color: "#4A6580" }
                  }
                >
                  {v} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          {agents.length === 0 ? (
            <>
              <div className="text-5xl mb-4">🔭</div>
              <h3 className="text-sm font-bold text-white mb-2">
                Marketplace launching soon
              </h3>
              <p className="text-xs text-dim max-w-xs mx-auto leading-relaxed mb-6">
                Our first agents are in review. Check back soon — or build one
                yourself.
              </p>
              <Link
                href="/sign-up?role=builder"
                className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-primary/20 transition-colors"
              >
                Become a Builder →
              </Link>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-bold text-white mb-1">No agents found</p>
              <p className="text-xs text-dim">
                Try a different search or clear the vertical filter.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveVertical(null);
                }}
                className="mt-4 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="text-xs text-dim mb-4">
            {filtered.length} agent{filtered.length !== 1 ? "s" : ""}
            {activeVertical ? ` in ${activeVertical}` : ""}
            {search ? ` matching "${search}"` : ""}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
