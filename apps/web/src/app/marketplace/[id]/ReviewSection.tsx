"use client";

import { useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  buyerName: string;
};

type Props = {
  agentId: string;
  reviews: Review[];
  canReview: boolean;
  myReview: { rating: number; comment: string } | null;
};

function Stars({ rating, interactive = false, onSelect }: {
  rating: number;
  interactive?: boolean;
  onSelect?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type={interactive ? "button" : undefined}
          disabled={!interactive}
          onClick={() => onSelect?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          style={{ background: "none", border: "none", padding: 0 }}
        >
          <span
            style={{
              color: s <= (hovered || rating) ? "#FF9500" : "#1C2D40",
              fontSize: interactive ? "1.25rem" : "0.875rem",
              lineHeight: 1,
            }}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ agentId, reviews: initialReviews, canReview, myReview }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) { setMsg({ text: "Select a star rating", ok: false }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error ?? "Failed", ok: false }); return; }
      // Replace or prepend review in list
      const newReview: Review = {
        id: data.id,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt,
        buyerName: data.buyer?.name ?? "You",
      };
      setReviews((prev) => {
        const without = prev.filter((r) => r.id !== newReview.id);
        return [newReview, ...without];
      });
      setMsg({ text: myReview ? "Review updated" : "Review submitted — thank you!", ok: true });
      setShowForm(false);
    } catch {
      setMsg({ text: "Network error", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">
            Reviews
          </h2>
          {avgRating !== null && (
            <div className="flex items-center gap-1.5">
              <Stars rating={Math.round(avgRating)} />
              <span className="text-xs text-dim">
                {avgRating} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-colors"
            style={{ background: "rgba(59,158,255,0.1)", color: "#3B9EFF" }}
          >
            {myReview ? "Edit Review" : "Write a Review"}
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <form
          onSubmit={submit}
          className="mb-6 rounded-xl border p-5 space-y-4"
          style={{ background: "#0C1520", borderColor: "#1C2D40" }}
        >
          <div>
            <label className="block text-xs text-dim mb-2">Your rating</label>
            <Stars rating={rating} interactive onSelect={setRating} />
          </div>
          <div>
            <label className="block text-xs text-dim mb-1.5">
              Comment <span className="text-dim">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="What did you like? What could be better?"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-xs text-text-main placeholder:text-dim focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
            <p className="text-xs text-dim text-right mt-0.5">{comment.length}/1000</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || rating < 1}
              className="text-xs font-bold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: "rgba(59,158,255,0.15)", color: "#3B9EFF" }}
            >
              {saving ? "Saving…" : myReview ? "Update Review" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setMsg(null); }}
              className="text-xs text-dim hover:text-text-main transition-colors"
            >
              Cancel
            </button>
            {msg && (
              <p
                className="text-xs font-medium"
                style={{ color: msg.ok ? "#2ECC71" : "#E74C3C" }}
              >
                {msg.ok ? "✓ " : "✗ "}{msg.text}
              </p>
            )}
          </div>
        </form>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-xs text-dim py-4">
          No reviews yet.{canReview ? " Be the first to review this agent." : ""}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border p-4"
              style={{ background: "#0C1520", borderColor: "#1C2D40" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs font-bold text-white">{r.buyerName}</span>
                </div>
                <span className="text-xs text-dim">
                  {new Date(r.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {r.comment && (
                <p className="text-xs text-dim leading-relaxed border-l-2 border-border pl-3">
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
