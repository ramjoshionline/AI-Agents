import Stripe from "stripe";

// Lazy singleton — Stripe v20 throws if apiKey is empty at construction time,
// so we defer initialization until the first actual request.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it to .env.local to use billing features."
      );
    }
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}
