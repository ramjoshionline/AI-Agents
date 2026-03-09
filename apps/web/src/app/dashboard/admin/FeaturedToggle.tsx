"use client";

import { useState } from "react";

export default function FeaturedToggle({
  agentId,
  featured,
}: {
  agentId: string;
  featured: boolean;
}) {
  const [active, setActive] = useState(featured);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/admin/agents/${agentId}/feature`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setActive(data.featured);
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={active ? "Remove from Featured" : "Add to Featured"}
      className="text-xs px-2 py-0.5 rounded font-bold transition-colors disabled:opacity-40"
      style={
        active
          ? { background: "rgba(155,89,182,0.15)", color: "#9B59B6" }
          : { background: "rgba(74,101,128,0.12)", color: "#4A6580" }
      }
    >
      {busy ? "…" : active ? "★ Featured" : "☆ Feature"}
    </button>
  );
}
