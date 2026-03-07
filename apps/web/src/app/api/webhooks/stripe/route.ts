import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

// Stripe requires the raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured." },
      { status: 503 }
    );
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        if (cs.mode !== "subscription") break;

        const agentId = cs.metadata?.agentId;
        const buyerId = cs.metadata?.buyerId;
        if (!agentId || !buyerId) break;

        const stripeSubscriptionId =
          typeof cs.subscription === "string"
            ? cs.subscription
            : cs.subscription?.id;

        // Fetch full subscription object for trial/period info
        let stripeSub: Stripe.Subscription | undefined;
        if (stripeSubscriptionId) {
          stripeSub = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
        }

        // Store stripeCustomerId on the user for future billing portal links
        const customerId =
          typeof cs.customer === "string" ? cs.customer : cs.customer?.id;
        if (customerId) {
          await prisma.user.update({
            where: { id: buyerId },
            data: { stripeCustomerId: customerId },
          });
        }

        // Use `any` cast for billing period fields — Stripe SDK v20 restructured
        // these properties but they still exist at runtime for the API version we use.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subAny = stripeSub as any;
        await prisma.subscription.create({
          data: {
            buyerId,
            agentId,
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: stripeSubscriptionId ?? null,
            stripeSessionId: cs.id,
            status: stripeSub?.status ?? "active",
            trialEndsAt: subAny?.trial_end
              ? new Date(subAny.trial_end * 1000)
              : null,
            currentPeriodEnd: subAny?.current_period_end
              ? new Date(subAny.current_period_end * 1000)
              : null,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
            trialEndsAt: sub.trial_end
              ? new Date(sub.trial_end * 1000)
              : null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "cancelled" },
        });
        break;
      }

      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inv = event.data.object as any;
        const subId: string | undefined =
          typeof inv.subscription === "string"
            ? inv.subscription
            : inv.subscription?.id;
        if (subId) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { status: "past_due" },
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
