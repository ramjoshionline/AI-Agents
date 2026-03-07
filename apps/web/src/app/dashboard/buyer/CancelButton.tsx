"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    const res = await fetch(
      `/api/buyer/subscriptions/${subscriptionId}/cancel`,
      { method: "POST" }
    );
    setLoading(false);
    if (res.ok) {
      setConfirm(false);
      router.refresh();
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-dim">Cancel?</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs text-red border border-red/30 px-2 py-1 rounded-lg hover:bg-red/10 transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-dim px-2 py-1"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-dim hover:text-red transition-colors border border-border px-3 py-1.5 rounded-lg"
    >
      Cancel
    </button>
  );
}
