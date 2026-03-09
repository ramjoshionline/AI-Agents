export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// ── event builder ─────────────────────────────────────────────────────────────

type Event = {
  key: string;
  date: Date;
  icon: string;
  title: string;
  detail: string;
  color: string;
  href?: string;
};

export default async function BuyerActivityPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  if (session.user.role !== "buyer") redirect("/dashboard/builder");

  const subscriptions = await prisma.subscription.findMany({
    where: { buyerId: session.user.id },
    include: {
      agent: { select: { id: true, name: true, vertical: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const reviews = await prisma.review.findMany({
    where: { buyerId: session.user.id },
    include: {
      agent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build timeline events
  const events: Event[] = [];

  for (const sub of subscriptions) {
    const agentName = sub.agent.name;
    const agentHref = `/marketplace/${sub.agent.id}`;

    // Subscription created
    events.push({
      key: `sub-created-${sub.id}`,
      date: new Date(sub.createdAt),
      icon: sub.status === "trialing" ? "🆓" : "✅",
      title: sub.status === "trialing"
        ? `Started free trial — ${agentName}`
        : `Subscribed to ${agentName}`,
      detail: sub.status === "trialing"
        ? `${sub.agent.vertical} · trial period began`
        : `${sub.agent.vertical} · subscription activated`,
      color: "#2ECC71",
      href: agentHref,
    });

    // Trial ended → active
    if (sub.status === "active" && sub.trialEndsAt) {
      events.push({
        key: `trial-ended-${sub.id}`,
        date: new Date(sub.trialEndsAt),
        icon: "💳",
        title: `Trial ended, billing started — ${agentName}`,
        detail: `${sub.agent.vertical} · now billed monthly`,
        color: "#FF9500",
        href: agentHref,
      });
    }

    // Cancellation
    if (sub.status === "cancelled") {
      events.push({
        key: `cancelled-${sub.id}`,
        date: new Date(sub.updatedAt),
        icon: "❌",
        title: `Cancelled ${agentName}`,
        detail: `${sub.agent.vertical} · subscription ended`,
        color: "#E74C3C",
        href: agentHref,
      });
    }

    // Renewal (currentPeriodEnd in the future = upcoming)
    if (sub.status === "active" && sub.currentPeriodEnd) {
      const end = new Date(sub.currentPeriodEnd);
      if (end > new Date()) {
        events.push({
          key: `renewal-${sub.id}`,
          date: end,
          icon: "🔄",
          title: `Upcoming renewal — ${agentName}`,
          detail: `${sub.agent.vertical} · scheduled billing`,
          color: "#3B9EFF",
          href: agentHref,
        });
      }
    }
  }

  for (const review of reviews) {
    events.push({
      key: `review-${review.id}`,
      date: new Date(review.createdAt),
      icon: "⭐",
      title: `Reviewed ${review.agent.name}`,
      detail: `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)} · ${
        review.comment ? `"${review.comment.slice(0, 60)}${review.comment.length > 60 ? "…" : ""}"` : "No comment"
      }`,
      color: "#FF9500",
      href: `/marketplace/${review.agent.id}`,
    });
  }

  // Sort: upcoming first, then past descending
  const now = new Date();
  const upcoming = events
    .filter((e) => e.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = events
    .filter((e) => e.date <= now)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const all = [...upcoming, ...past];

  // Group by month label
  function groupLabel(date: Date): string {
    if (date > now) return "Upcoming";
    const monthYear = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    return monthYear;
  }

  const grouped: { label: string; events: Event[] }[] = [];
  for (const event of all) {
    const label = groupLabel(event.date);
    const last = grouped[grouped.length - 1];
    if (last?.label === label) {
      last.events.push(event);
    } else {
      grouped.push({ label, events: [event] });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/buyer"
          className="text-xs text-dim hover:text-primary transition-colors"
        >
          ← Dashboard
        </Link>
        <h1 className="text-xl font-extrabold text-white mt-2">Activity</h1>
        <p className="text-xs text-dim mt-1">
          Your subscription events, billing history, and reviews.
        </p>
      </div>

      {all.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed p-16 text-center"
          style={{ borderColor: "#1C2D40" }}
        >
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm font-bold text-white mb-2">No activity yet</div>
          <p className="text-xs text-dim leading-relaxed max-w-xs mx-auto mb-6">
            Subscribe to an agent to start seeing your activity feed here.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-primary text-black font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse Marketplace →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ label, events: groupEvents }) => (
            <div key={label}>
              <div className="text-xs font-bold text-dim uppercase tracking-widest mb-4 flex items-center gap-3">
                {label}
                {label === "Upcoming" && (
                  <span
                    className="text-xs px-2 py-0.5 rounded font-bold normal-case tracking-normal"
                    style={{ background: "rgba(59,158,255,0.12)", color: "#3B9EFF" }}
                  >
                    {groupEvents.length}
                  </span>
                )}
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div
                  className="absolute left-3.5 top-0 bottom-0 w-px"
                  style={{ background: "#1C2D40" }}
                />

                <div className="space-y-4">
                  {groupEvents.map((event) => (
                    <div key={event.key} className="flex gap-4 items-start">
                      {/* Dot */}
                      <div
                        className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 border"
                        style={{
                          background: `${event.color}12`,
                          borderColor: `${event.color}30`,
                        }}
                      >
                        {event.icon}
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 rounded-xl border p-4 -mt-0.5"
                        style={{ background: "#0A1628", borderColor: "#1C2D40" }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          {event.href ? (
                            <Link
                              href={event.href}
                              className="text-xs font-bold text-white hover:text-primary transition-colors leading-snug"
                            >
                              {event.title}
                            </Link>
                          ) : (
                            <span className="text-xs font-bold text-white leading-snug">
                              {event.title}
                            </span>
                          )}
                          <span className="text-xs text-dim shrink-0">
                            {event.date > now
                              ? event.date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : event.date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year:
                                    event.date.getFullYear() !==
                                    now.getFullYear()
                                      ? "numeric"
                                      : undefined,
                                })}
                          </span>
                        </div>
                        <p className="text-xs text-dim leading-relaxed">
                          {event.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
