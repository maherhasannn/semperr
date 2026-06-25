import { NextRequest, NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase-server";
import { getStripe, MINIMUM_PREPAY_CENTS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: firmUser } = await supabase
    .from("firm_users")
    .select("id, firm_id, firms(id, name, stripe_customer_id)")
    .eq("auth_user_id", user.id)
    .single();

  if (!firmUser) {
    return NextResponse.json({ error: "No firm found" }, { status: 404 });
  }

  const firm = firmUser.firms as unknown as {
    id: string;
    name: string;
    stripe_customer_id: string | null;
  };

  const stripe = getStripe();
  let stripeCustomerId = firm.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: firm.name,
      metadata: { firm_id: firm.id },
    });
    stripeCustomerId = customer.id;

    const service = createServiceClient();
    await service
      .from("firms")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", firm.id);
  }

  const origin = request.headers.get("origin") || request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    payment_intent_data: {
      setup_future_usage: "off_session",
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Semperr Account Prepayment",
            description: `Initial balance top-up for ${firm.name}`,
          },
          unit_amount: MINIMUM_PREPAY_CENTS,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/onboarding?step=complete&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/onboarding?step=payment&cancelled=true`,
    metadata: {
      firm_id: firm.id,
      firm_user_id: firmUser.id,
      type: "onboarding_prepay",
    },
  });

  return NextResponse.json({ sessionUrl: session.url });
}
