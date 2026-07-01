import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

async function updateFirmPaymentState(
  firmId: string,
  state: {
    stripe_customer_id?: string;
    payment_status: "valid" | "invalid" | "card_failed" | "missing";
    has_valid_payment_method: boolean;
    status: "active" | "paused" | "pending_verification";
  },
) {
  await createServiceClient().from("firms").update(state).eq("id", firmId);
}

async function handlePaymentMethodSetup(session: Stripe.Checkout.Session) {
  const firmId = session.metadata?.firm_id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const setupIntentId =
    typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent?.id;

  if (!firmId || !customerId || !setupIntentId) return;

  const stripe = getStripe();
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethodId) return;

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  const service = createServiceClient();
  const { data: firm } = await service
    .from("firms")
    .select("id, status")
    .eq("id", firmId)
    .maybeSingle();

  if (!firm) return;

  await updateFirmPaymentState(firmId, {
    stripe_customer_id: customerId,
    payment_status: "valid",
    has_valid_payment_method: true,
    status: firm.status === "pending_verification" ? "pending_verification" : "active",
  });
}

async function handlePaymentFailure(customerId: string | null | undefined) {
  if (!customerId) return;

  const service = createServiceClient();
  const { data: firm } = await service
    .from("firms")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!firm) return;

  const { data: currentFirm } = await service
    .from("firms")
    .select("id, status")
    .eq("id", firm.id)
    .maybeSingle();

  await updateFirmPaymentState(firm.id, {
    payment_status: "card_failed",
    has_valid_payment_method: false,
    status: currentFirm?.status === "pending_verification" ? "pending_verification" : "paused",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type === "payment_method_setup") {
      await handlePaymentMethodSetup(session);
      return NextResponse.json({ received: true });
    }

    if (session.metadata?.type !== "onboarding_prepay") {
      return NextResponse.json({ received: true });
    }

    const firmId = session.metadata.firm_id;
    const firmUserId = session.metadata.firm_user_id;
    const stripeRef = session.payment_intent as string;

    const service = createServiceClient();

    const { data: existingEntry } = await service
      .from("transactions")
      .select("id")
      .eq("stripe_ref", stripeRef)
      .maybeSingle();

    if (!existingEntry) {
      await service.from("transactions").insert({
        firm_id: firmId,
        type: "topup",
        amount_cents: session.amount_total!,
        stripe_ref: stripeRef,
        note: "Initial prepayment during onboarding",
      });
    }

    await service.from("firm_users").update({ onboarding_completed: true }).eq("id", firmUserId);
  }

  if (event.type === "invoice.payment_failed" || event.type === "payment_intent.payment_failed") {
    const object = event.data.object as Stripe.Invoice | Stripe.PaymentIntent;
    const customerId =
      typeof object.customer === "string"
        ? object.customer
        : object.customer?.id ?? null;

    await handlePaymentFailure(customerId);
  }

  // TODO: add a dedicated checkout/setup-intent creation route when billing UI is enabled.

  return NextResponse.json({ received: true });
}
