import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendWelcomeEmail } from "@/lib/email";

async function ensureFirmDefaults(
  supabase: ReturnType<typeof createServiceClient>,
  firmId: string,
) {
  const [deliverySettingsResult, buyingRulesResult] = await Promise.all([
    supabase
      .from("firm_delivery_settings")
      .upsert({ firm_id: firmId }, { onConflict: "firm_id" }),
    supabase.from("firm_buying_rules").upsert({ firm_id: firmId }, { onConflict: "firm_id" }),
  ]);

  return {
    deliverySettingsError: deliverySettingsResult.error,
    buyingRulesError: buyingRulesResult.error,
  };
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, firmName, email, password } = await request.json();

    if (!firstName || !lastName || !firmName || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    const { data: existingUser } = await supabase
      .from("firm_users")
      .select("id, firm_id")
      .eq("email", email)
      .is("user_id", null)
      .single();

    if (existingUser) {
      const { error: linkError } = await supabase
        .from("firm_users")
        .update({ user_id: authUser.user.id, name: fullName })
        .eq("id", existingUser.id);

      if (linkError) {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json({ error: "Failed to link account" }, { status: 500 });
      }

      const defaults = await ensureFirmDefaults(supabase, existingUser.firm_id);
      if (defaults.deliverySettingsError || defaults.buyingRulesError) {
        await supabase.from("firm_users").update({ user_id: null }).eq("id", existingUser.id);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json({ error: "Failed to initialize firm settings" }, { status: 500 });
      }

      return NextResponse.json({ success: true, linked: true });
    }

    const { data: firm, error: firmError } = await supabase
      .from("firms")
      .insert({
        name: firmName,
        status: "paused",
        payment_status: "missing",
        has_valid_payment_method: false,
        states_covered: [],
      })
      .select("id")
      .single();

    if (firmError) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: "Failed to create firm" }, { status: 500 });
    }

    const { error: userError } = await supabase.from("firm_users").insert({
      firm_id: firm.id,
      user_id: authUser.user.id,
      email,
      name: fullName,
      role: "owner",
      onboarding_completed: false,
    });

    if (userError) {
      await supabase.from("firms").delete().eq("id", firm.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
    }

    const defaults = await ensureFirmDefaults(supabase, firm.id);

    if (defaults.deliverySettingsError) {
      await supabase.from("firm_users").delete().eq("firm_id", firm.id);
      await supabase.from("firms").delete().eq("id", firm.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: "Failed to create delivery settings" }, { status: 500 });
    }

    if (defaults.buyingRulesError) {
      await supabase.from("firm_delivery_settings").delete().eq("firm_id", firm.id);
      await supabase.from("firm_users").delete().eq("firm_id", firm.id);
      await supabase.from("firms").delete().eq("id", firm.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: "Failed to create buying rules" }, { status: 500 });
    }

    try {
      await sendWelcomeEmail(email, firstName, firmName);
    } catch {
      // Account creation should not fail if the welcome email service is temporarily unavailable.
    }

    return NextResponse.json({ success: true, linked: false });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
