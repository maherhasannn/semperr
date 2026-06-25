import { NextRequest, NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "session_id required" },
      { status: 400 },
    );
  }

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return NextResponse.json({ completed: false });
  }

  const firmId = session.metadata?.firm_id;
  const firmUserId = session.metadata?.firm_user_id;
  if (!firmId || !firmUserId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: existingEntry } = await service
    .from("ledger_entries")
    .select("id")
    .eq("stripe_ref", session.payment_intent as string)
    .single();

  if (!existingEntry) {
    await service.from("ledger_entries").insert({
      firm_id: firmId,
      type: "topup",
      amount_cents: session.amount_total!,
      stripe_ref: session.payment_intent as string,
      note: "Initial prepayment during onboarding",
    });
  }

  await service
    .from("firm_users")
    .update({ onboarding_completed: true })
    .eq("id", firmUserId);

  return NextResponse.json({ completed: true });
}
