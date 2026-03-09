"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AgentDetailClient({
  agentId,
  status,
}: {
  agentId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const res = await fetch(`/api/builder/agents/${agentId}/submit`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/builder/agents/${agentId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.push("/dashboard/builder/agents");
  }

  const canEdit = ["draft", "rejected", "live"].includes(status);
  const canSubmit = ["draft", "rejected"].includes(status);

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap">
      {/* Test in Sandbox */}
      <Link
        href={`/dashboard/builder/agents/${agentId}/sandbox`}
        className="text-xs bg-green/10 border border-green/30 text-green font-bold px-4 py-2 rounded-lg hover:bg-green/20 transition-colors"
      >
        🧪 Test in Sandbox
      </Link>

      {/* Submit for review (draft/rejected) */}
      {canSubmit && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="text-xs bg-primary text-black font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit for Review"}
        </button>
      )}

      {/* Edit button */}
      {canEdit && (
        <div className="relative group">
          <a
            href={`/dashboard/builder/agents/${agentId}/edit`}
            className="text-xs border border-border text-dim hover:text-text-main px-4 py-2 rounded-lg transition-colors inline-block"
          >
            {status === "live" ? "✏ Edit Agent" : "Edit"}
          </a>
          {/* Tooltip for live agents */}
          {status === "live" && (
            <div
              className="absolute bottom-full left-0 mb-2 w-56 text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10"
              style={{ background: "#0C1520", border: "1px solid #1C2D40" }}
            >
              <div className="font-bold text-white mb-1">Editing a live agent</div>
              <p className="text-dim leading-relaxed">
                Name, tagline, description, price &amp; tools update immediately.
                Changing the <span className="text-primary">system prompt</span> will pause the listing and send it back for review.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete */}
      {status !== "review" && (
        <>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-dim">
                {status === "live" ? "Delist & delete?" : "Confirm?"}
              </span>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-xs border px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                style={{ borderColor: "rgba(231,76,60,0.4)", color: "#E74C3C" }}
              >
                {status === "live" ? "Delist" : "Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-dim px-3 py-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-dim hover:text-red transition-colors px-2 py-2"
            >
              {status === "live" ? "Delist" : "Delete"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
