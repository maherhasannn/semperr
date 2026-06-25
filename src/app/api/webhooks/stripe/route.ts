import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type !== "onboarding_prepay") {
      return NextResponse.json({ received: true });
    }

    const firmId = session.metadata.firm_id;
    const firmUserId = session.metadata.firm_user_id;
    const stripeRef = session.payment_intent as string;

    const service = createServiceClient();

    const { data: existingEntry } = await service
      .from("ledger_entries")
      .select("id")
      .eq("stripe_ref", stripeRef)
      .single();

    if (!existingEntry) {
      await service.from("ledger_entries").insert({
        firm_id: firmId,
        type: "topup",
        amount_cents: session.amount_total!,
        stripe_ref: stripeRef,
        note: "Initial prepayment during onboarding",
      });
    }

    await service
      .from("firm_users")
      .update({ onboarding_completed: true })
      .eq("id", firmUserId);
  }

  return NextResponse.json({ received: true });
}
