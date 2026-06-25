import Stripe from "stripe";

let stripeInstance: Stripe;

export function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeInstance;
}

export const MINIMUM_PREPAY_CENTS = Number.parseInt(
  process.env.STRIPE_MINIMUM_PREPAY_CENTS || "50000",
  10,
);
