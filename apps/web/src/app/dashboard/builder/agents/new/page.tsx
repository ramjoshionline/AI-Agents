"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  VERTICALS,
  TOOLS,
  PRICING_MODELS,
  TRIAL_OPTIONS,
} from "@/lib/agentConstants";

type AgentDraft = {
  name: string;
  tagline: string;
  description: string;
  vertical: string;
  systemPrompt: string;
  tools: string[];
  pricingModel: string;
  priceMonthly: number;
  trialDays: number;
};

const INITIAL: AgentDraft = {
  name: "",
  tagline: "",
  description: "",
  vertical: "",
  systemPrompt: "",
  tools: [],
  pricingModel: "flat",
  priceMonthly: 99,
  trialDays: 0,
};

const STEPS = [
  { num: 1, label: "Identity", icon: "🏷️" },
  { num: 2, label: "Intelligence", icon: "🧠" },
  { num: 3, label: "Pricing", icon: "💸" },
  { num: 4, label: "Review", icon: "🚀" },
];

// ── Step components ────────────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
}: {
  data: AgentDraft;
  onChange: (k: keyof AgentDraft, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-1.5">
          Agent Name <span className="text-red">*</span>
        </label>
        <input
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Dental Receptionist AI"
          maxLength={60}
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-xs text-text-main placeholder-dim outline-none focus:border-primary/60 transition-colors"
        />
        <p className="text-xs text-dim mt-1">{data.name.length}/60 chars</p>
      </div>

      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-1.5">
          Tagline <span className="text-red">*</span>
        </label>
        <input
          value={data.tagline}
          onChange={(e) => onChange("tagline", e.target.value)}
          placeholder="e.g. Books appointments and handles insurance queries 24/7"
          maxLength={100}
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-xs text-text-main placeholder-dim outline-none focus:border-primary/60 transition-colors"
        />
        <p className="text-xs text-dim mt-1">
          Shown in the marketplace card. {data.tagline.length}/100 chars.
        </p>
      </div>

      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-1.5">
          Full Description <span className="text-red">*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="What does this agent do? What problems does it solve? What integrations does it use? Be specific."
          rows={5}
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-xs text-text-main placeholder-dim outline-none focus:border-primary/60 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-1.5">
          Industry Vertical <span className="text-red">*</span>
        </label>
        <select
          value={data.vertical}
          onChange={(e) => onChange("vertical", e.target.value)}
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-xs text-text-main outline-none focus:border-primary/60 transition-colors"
          style={{ colorScheme: "dark" }}
        >
          <option value="">Select a vertical…</option>
          {VERTICALS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <p className="text-xs text-dim mt-1">
          This determines which category your agent appears in.
        </p>
      </div>
    </div>
  );
}

function Step2({
  data,
  onChange,
  onToolToggle,
}: {
  data: AgentDraft;
  onChange: (k: keyof AgentDraft, v: string) => void;
  onToolToggle: (toolId: string) => void;
}) {
  const grouped = TOOLS.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, typeof TOOLS>
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-1.5">
          System Prompt <span className="text-red">*</span>
        </label>
        <div
          className="text-xs text-dim mb-2 rounded-lg px-3 py-2 border"
          style={{ background: "rgba(255,149,0,0.05)", borderColor: "rgba(255,149,0,0.2)" }}
        >
          🔒 This is never shown to buyers. Your IP is fully protected.
        </div>
        <textarea
          value={data.systemPrompt}
          onChange={(e) => onChange("systemPrompt", e.target.value)}
          placeholder={`You are a professional dental receptionist AI for {{practice_name}}.\n\nYour job is to:\n- Answer questions about services and pricing\n- Book, reschedule, and cancel appointments\n- Handle insurance pre-authorization queries\n- Follow up on missed appointments\n\nAlways be warm, professional, and HIPAA-aware. Never store or repeat sensitive health information.`}
          rows={12}
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-xs text-text-main placeholder-dim outline-none focus:border-primary/60 transition-colors resize-none font-mono leading-relaxed"
        />
        <p className="text-xs text-dim mt-1">
          Use {`{{variable}}`} placeholders for buyer-specific values (e.g.{" "}
          {`{{business_name}}`}).
        </p>
      </div>

      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-3">
          Available Integrations
        </label>
        <p className="text-xs text-dim mb-4 leading-relaxed">
          Select the tools this agent can use. Buyers connect their accounts via
          OAuth during onboarding.
        </p>

        <div className="space-y-4">
          {Object.entries(grouped).map(([category, tools]) => (
            <div key={category}>
              <div className="text-xs text-primary uppercase tracking-widest mb-2">
                {category}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tools.map((tool) => {
                  const selected = data.tools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onToolToggle(tool.id)}
                      className="flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
                      style={
                        selected
                          ? {
                              background: "rgba(59,158,255,0.1)",
                              borderColor: "rgba(59,158,255,0.4)",
                            }
                          : {
                              background: "transparent",
                              borderColor: "#1C2D40",
                            }
                      }
                    >
                      <span className="text-base shrink-0">{tool.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-bold"
                          style={selected ? { color: "#3B9EFF" } : { color: "#BDD0E0" }}
                        >
                          {tool.name}
                        </div>
                        <div className="text-xs text-dim truncate">{tool.desc}</div>
                      </div>
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0"
                        style={{
                          borderColor: selected ? "#3B9EFF" : "#1C2D40",
                          background: selected ? "#3B9EFF" : "transparent",
                        }}
                      >
                        {selected && (
                          <svg
                            className="w-2.5 h-2.5 text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({
  data,
  onChange,
  onNumberChange,
}: {
  data: AgentDraft;
  onChange: (k: keyof AgentDraft, v: string) => void;
  onNumberChange: (k: keyof AgentDraft, v: number) => void;
}) {
  const monthlyRevenue = data.priceMonthly * 0.72; // 72% builder cut estimate

  return (
    <div className="space-y-6">
      {/* Pricing model */}
      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-3">
          Pricing Model <span className="text-red">*</span>
        </label>
        <div className="space-y-3">
          {PRICING_MODELS.map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => onChange("pricingModel", pm.id)}
              className="w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all"
              style={
                data.pricingModel === pm.id
                  ? {
                      background: "rgba(255,149,0,0.08)",
                      borderColor: "rgba(255,149,0,0.4)",
                    }
                  : { background: "transparent", borderColor: "#1C2D40" }
              }
            >
              <div className="text-2xl shrink-0">{pm.icon}</div>
              <div className="flex-1">
                <div
                  className="text-xs font-bold mb-1"
                  style={
                    data.pricingModel === pm.id
                      ? { color: "#FF9500" }
                      : { color: "#BDD0E0" }
                  }
                >
                  {pm.label}
                </div>
                <div className="text-xs text-dim leading-relaxed">{pm.desc}</div>
              </div>
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  borderColor:
                    data.pricingModel === pm.id ? "#FF9500" : "#1C2D40",
                }}
              >
                {data.pricingModel === pm.id && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#FF9500" }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-1.5">
          Monthly Price (USD) <span className="text-red">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dim text-xs">
            $
          </span>
          <input
            type="number"
            value={data.priceMonthly}
            onChange={(e) =>
              onNumberChange("priceMonthly", parseFloat(e.target.value) || 0)
            }
            min={1}
            max={9999}
            step={1}
            className="w-full bg-bg border border-border rounded-lg pl-8 pr-4 py-2.5 text-xs text-text-main outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        {/* Revenue preview */}
        <div
          className="mt-3 rounded-lg p-4 border"
          style={{
            background: "rgba(46,204,113,0.06)",
            borderColor: "rgba(46,204,113,0.2)",
          }}
        >
          <div className="text-xs text-dim mb-2">Your estimated earnings:</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { subs: 10, label: "10 subscribers" },
              { subs: 50, label: "50 subscribers" },
              { subs: 100, label: "100 subscribers" },
            ].map(({ subs, label }) => (
              <div
                key={subs}
                className="rounded-lg p-2"
                style={{ background: "rgba(46,204,113,0.08)" }}
              >
                <div className="text-green font-bold text-sm">
                  ${Math.round(monthlyRevenue * subs).toLocaleString()}
                  <span className="text-xs font-normal">/mo</span>
                </div>
                <div className="text-xs text-dim">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-dim mt-2 text-center">
            Based on ~72% revenue share
          </p>
        </div>
      </div>

      {/* Free trial */}
      <div>
        <label className="block text-xs text-dim uppercase tracking-wide mb-3">
          Free Trial Period
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TRIAL_OPTIONS.map(({ days, label }) => (
            <button
              key={days}
              type="button"
              onClick={() => onNumberChange("trialDays", days)}
              className="py-2.5 px-3 rounded-lg border text-xs transition-all"
              style={
                data.trialDays === days
                  ? {
                      background: "rgba(255,149,0,0.12)",
                      borderColor: "rgba(255,149,0,0.4)",
                      color: "#FF9500",
                      fontWeight: "bold",
                    }
                  : { borderColor: "#1C2D40", color: "#4A6580" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({
  data,
  loading,
  onSaveDraft,
  onSubmit,
}: {
  data: AgentDraft;
  loading: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  const toolNames = TOOLS.filter((t) => data.tools.includes(t.id)).map(
    (t) => t.name
  );

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl p-5 border"
        style={{
          background: "rgba(255,149,0,0.04)",
          borderColor: "rgba(255,149,0,0.2)",
        }}
      >
        <div className="text-xs text-primary font-bold uppercase tracking-wide mb-4">
          Agent Summary
        </div>
        <div className="space-y-3 text-xs">
          {[
            { label: "Name", value: data.name },
            { label: "Tagline", value: data.tagline },
            { label: "Vertical", value: data.vertical },
            {
              label: "Pricing",
              value: `$${data.priceMonthly}/mo · ${
                data.pricingModel
              } model · ${
                data.trialDays === 0
                  ? "No trial"
                  : `${data.trialDays}-day trial`
              }`,
            },
            {
              label: "Tools",
              value:
                toolNames.length > 0
                  ? toolNames.join(", ")
                  : "No integrations selected",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <span className="text-dim w-20 shrink-0">{label}</span>
              <span className="text-text-main">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System prompt preview */}
      <div>
        <div className="text-xs text-dim uppercase tracking-wide mb-2">
          System Prompt Preview (first 200 chars)
        </div>
        <div
          className="rounded-lg p-4 text-xs text-dim leading-relaxed border"
          style={{ background: "#070B0F", borderColor: "#1C2D40" }}
        >
          {data.systemPrompt.slice(0, 200)}
          {data.systemPrompt.length > 200 && (
            <span className="text-primary"> …{data.systemPrompt.length - 200} more chars</span>
          )}
        </div>
      </div>

      {/* What happens next */}
      <div
        className="rounded-xl p-5 border"
        style={{
          background: "rgba(46,204,113,0.05)",
          borderColor: "rgba(46,204,113,0.2)",
        }}
      >
        <div className="text-xs text-green font-bold mb-3">
          What happens after Submit?
        </div>
        <div className="space-y-2 text-xs text-dim">
          {[
            "Your agent enters the review queue",
            "We run automated tests + security scans",
            "A human QA reviewer checks quality",
            "You get approved or feedback within 48h",
            "Once live — buyers can subscribe immediately",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-green">✓</span>
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={loading}
          className="flex-1 border border-border text-text-main text-xs font-bold py-3 rounded-lg hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
        >
          {loading ? "Saving…" : "Save as Draft"}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-primary text-black text-xs font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {loading ? "Submitting…" : "Submit for Review →"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<AgentDraft>(INITIAL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onChange(key: keyof AgentDraft, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onNumberChange(key: keyof AgentDraft, value: number) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onToolToggle(toolId: string) {
    setDraft((d) => ({
      ...d,
      tools: d.tools.includes(toolId)
        ? d.tools.filter((t) => t !== toolId)
        : [...d.tools, toolId],
    }));
  }

  function validateStep(): string {
    if (step === 1) {
      if (!draft.name.trim()) return "Agent name is required.";
      if (!draft.tagline.trim()) return "Tagline is required.";
      if (!draft.description.trim()) return "Description is required.";
      if (!draft.vertical) return "Please select an industry vertical.";
    }
    if (step === 2) {
      if (!draft.systemPrompt.trim()) return "System prompt is required.";
      if (draft.systemPrompt.trim().length < 50)
        return "System prompt must be at least 50 characters.";
    }
    if (step === 3) {
      if (draft.priceMonthly <= 0) return "Price must be greater than $0.";
    }
    return "";
  }

  function nextStep() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  }

  async function save(submitForReview: boolean) {
    setError("");
    setLoading(true);

    const res = await fetch("/api/builder/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, submitForReview }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to save agent.");
      return;
    }

    router.push("/dashboard/builder/agents");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link
        href="/dashboard/builder/agents"
        className="inline-flex items-center gap-1 text-xs text-dim hover:text-text-main transition-colors mb-6"
      >
        ← My Agents
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-white">Create New Agent</h1>
        <p className="text-xs text-dim mt-1">
          Define your agent, set your price, and submit for review.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map(({ num, label, icon }) => (
          <div key={num} className="flex items-center gap-2">
            {num > 1 && (
              <div
                className="w-8 h-px shrink-0"
                style={{
                  background: step >= num ? "#FF9500" : "#1C2D40",
                }}
              />
            )}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 transition-all"
              style={
                step === num
                  ? { background: "rgba(255,149,0,0.15)", border: "1px solid rgba(255,149,0,0.4)" }
                  : step > num
                  ? { background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)" }
                  : { background: "transparent", border: "1px solid #1C2D40" }
              }
            >
              <span className="text-sm">{step > num ? "✓" : icon}</span>
              <span
                className="text-xs font-bold"
                style={
                  step === num
                    ? { color: "#FF9500" }
                    : step > num
                    ? { color: "#2ECC71" }
                    : { color: "#4A6580" }
                }
              >
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-xs text-red bg-red/10 border border-red/20 rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="text-sm font-bold text-white mb-5">
          {STEPS[step - 1].icon} Step {step}: {STEPS[step - 1].label}
        </div>

        {step === 1 && <Step1 data={draft} onChange={onChange} />}
        {step === 2 && (
          <Step2 data={draft} onChange={onChange} onToolToggle={onToolToggle} />
        )}
        {step === 3 && (
          <Step3
            data={draft}
            onChange={onChange}
            onNumberChange={onNumberChange}
          />
        )}
        {step === 4 && (
          <Step4
            data={draft}
            loading={loading}
            onSaveDraft={() => save(false)}
            onSubmit={() => save(true)}
          />
        )}
      </div>

      {/* Navigation (steps 1-3) */}
      {step < 4 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep((s) => s - 1);
            }}
            disabled={step === 1}
            className="text-xs text-dim hover:text-text-main transition-colors disabled:opacity-30"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            className="bg-primary text-black font-bold text-xs px-8 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
