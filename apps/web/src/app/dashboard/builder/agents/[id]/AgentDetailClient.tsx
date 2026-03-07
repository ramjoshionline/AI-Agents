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
    const res = await fetch(`/api/builder/agents/${agentId}/submit`, {
      method: "POST",
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  }

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/builder/agents/${agentId}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard/builder/agents");
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap">
      {/* Test in Sandbox */}
      <Link
        href={`/dashboard/builder/agents/${agentId}/sandbox`}
        className="text-xs bg-green/10 border border-green/30 text-green font-bold px-4 py-2 rounded-lg hover:bg-green/20 transition-colors"
      >
        🧪 Test in Sandbox
      </Link>

      {/* Submit for review */}
      {["draft", "rejected"].includes(status) && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="text-xs bg-primary text-black font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit for Review"}
        </button>
      )}

      {/* Edit (draft/rejected only) */}
      {["draft", "rejected"].includes(status) && (
        <a
          href={`/dashboard/builder/agents/${agentId}/edit`}
          className="text-xs border border-border text-dim hover:text-text-main px-4 py-2 rounded-lg transition-colors"
        >
          Edit
        </a>
      )}

      {/* Delete */}
      {status !== "live" && (
        <>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-dim">Confirm?</span>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-xs text-red border border-red/30 px-3 py-2 rounded-lg hover:bg-red/10 transition-colors disabled:opacity-50"
              >
                Delete
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
              Delete
            </button>
          )}
        </>
      )}
    </div>
  );
}
