"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  agentId: string;
  priceDisplay: string;
  trialDays: number;
  isAuthenticated: boolean;
  isBuyer: boolean;
  isAlreadySubscribed: boolean;
  stripeConfigured: boolean;
};

export default function SubscribeButton({
  agentId,
  priceDisplay,
  trialDays,
  isAuthenticated,
  isBuyer,
  isAlreadySubscribed,
  stripeConfigured,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ctaLabel =
    trialDays > 0
      ? `Start ${trialDays}-Day Free Trial`
      : `Subscribe for ${priceDisplay}`;

  async function handleSubscribe() {
    setError("");
    setLoading(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to start checkout.");
      return;
    }

    window.location.href = data.url;
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-2">
        <Link
          href={`/sign-up?role=buyer&redirect=/marketplace/${agentId}`}
          className="block w-full text-center bg-primary text-black font-bold text-sm py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          {ctaLabel}
        </Link>
        <Link
          href={`/sign-in?redirect=/marketplace/${agentId}`}
          className="block w-full text-center border border-border text-dim text-xs py-2.5 rounded-lg hover:text-text-main transition-colors"
        >
          Already have an account? Sign in
        </Link>
      </div>
    );
  }

  if (!isBuyer) {
    return (
      <div
        className="text-center text-xs text-dim px-4 py-3 rounded-lg border"
        style={{ borderColor: "#1C2D40" }}
      >
        Sign in as a buyer to subscribe.
      </div>
    );
  }

  if (isAlreadySubscribed) {
    return (
      <div>
        <div
          className="w-full text-center text-sm font-bold py-3 rounded-lg mb-2"
          style={{ background: "rgba(46,204,113,0.12)", color: "#2ECC71" }}
        >
          ✓ Already subscribed
        </div>
        <Link
          href="/dashboard/buyer"
          className="block text-center text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Manage in dashboard →
        </Link>
      </div>
    );
  }

  if (!stripeConfigured) {
    return (
      <div
        className="text-center text-xs text-dim px-4 py-3 rounded-lg border"
        style={{ borderColor: "#1C2D40" }}
      >
        Billing not configured — set{" "}
        <code className="font-mono">STRIPE_SECRET_KEY</code> in .env.local
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          className="text-xs text-red mb-3 px-3 py-2 rounded-lg border"
          style={{
            background: "rgba(231,76,60,0.08)",
            borderColor: "rgba(231,76,60,0.3)",
          }}
        >
          {error}
        </div>
      )}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-primary text-black font-bold text-sm py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Redirecting to checkout…" : ctaLabel}
      </button>
      {trialDays > 0 && (
        <p className="text-xs text-dim text-center mt-2">
          No credit card required for trial
        </p>
      )}
    </div>
  );
}
