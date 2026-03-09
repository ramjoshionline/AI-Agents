"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ReviewActions({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    const res = await fetch(`/api/admin/agents/${agentId}/approve`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to approve");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleReject() {
    setError(null);
    const res = await fetch(`/api/admin/agents/${agentId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: rejectNote }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to reject");
      return;
    }
    setShowRejectModal(false);
    setRejectNote("");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {error && (
          <span className="text-xs text-red-400 mr-1">{error}</span>
        )}
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40"
          style={{ background: "rgba(46,204,113,0.15)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.3)" }}
        >
          Approve
        </button>
        <button
          onClick={() => { setShowRejectModal(true); setError(null); }}
          disabled={isPending}
          className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40"
          style={{ background: "rgba(231,76,60,0.1)", color: "#E74C3C", border: "1px solid rgba(231,76,60,0.3)" }}
        >
          Reject
        </button>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: "#0C1520", borderColor: "#1C2D40" }}
          >
            <h3 className="text-sm font-bold text-white mb-1">Reject Agent</h3>
            <p className="text-xs text-dim mb-4">
              Provide feedback so the builder can revise and resubmit.
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. System prompt is too vague — please add specific instructions and example use cases."
              rows={4}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-xs text-text-main placeholder-dim outline-none resize-none leading-relaxed mb-4"
              style={{ borderColor: "#1C2D40" }}
            />
            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRejectModal(false); setRejectNote(""); setError(null); }}
                className="text-xs px-4 py-2 rounded-lg border border-border text-dim hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="text-xs px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-40"
                style={{ background: "#E74C3C", color: "white" }}
              >
                {isPending ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
