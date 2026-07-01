import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendWelcomeEmail } from "@/lib/email";
import { normalizeNotificationTarget } from "@/lib/notification-targets";
import { normalizeUsState, normalizeUsStateList, normalizeWebsiteUrl } from "@/lib/firm-onboarding";

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

async function ensureNotificationTargets(
  supabase: ReturnType<typeof createServiceClient>,
  firmId: string,
  email: string,
  phoneNumber?: string | null,
) {
  const emailTarget = normalizeNotificationTarget("email", email);
  if (emailTarget.error) {
    return { error: emailTarget.error };
  }

  const targets = [
    {
      firm_id: firmId,
      channel: "email",
      value: emailTarget.normalizedValue,
      label: "Primary account email",
      is_primary: true,
      active: true,
    },
  ];

  if (typeof phoneNumber === "string" && phoneNumber.trim()) {
    const phoneTarget = normalizeNotificationTarget("sms", phoneNumber);
    if (phoneTarget.error) {
      return { error: phoneTarget.error };
    }
    targets.push({
      firm_id: firmId,
      channel: "sms",
      value: phoneTarget.normalizedValue,
      label: "Primary account SMS",
      is_primary: true,
      active: true,
    });
  }

  const { error } = await supabase.from("firm_notification_targets").upsert(targets, {
    onConflict: "firm_id,channel,value",
  });

  return { error };
}

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      firmName,
      email,
      password,
      phoneNumber,
      title,
      websiteUrl,
      barNumber,
      barState,
      statesCovered,
      practiceAreas,
      supportNotes,
    } = await request.json();

    if (!firstName || !lastName || !firmName || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const websiteTarget = normalizeWebsiteUrl(typeof websiteUrl === "string" ? websiteUrl : "");
    if (websiteTarget.error) {
      return NextResponse.json({ error: websiteTarget.error }, { status: 400 });
    }

    const barStateTarget = normalizeUsState(typeof barState === "string" ? barState : "");
    if (barStateTarget.error) {
      return NextResponse.json({ error: barStateTarget.error }, { status: 400 });
    }

    const statesCoveredTarget = normalizeUsStateList(
      Array.isArray(statesCovered)
        ? statesCovered.map((value: unknown) => String(value).trim()).join(", ")
        : typeof statesCovered === "string"
          ? statesCovered
          : "",
    );
    if (statesCoveredTarget.error) {
      return NextResponse.json({ error: statesCoveredTarget.error }, { status: 400 });
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
      const notificationTargets = await ensureNotificationTargets(
        supabase,
        existingUser.firm_id,
        email,
        typeof phoneNumber === "string" ? phoneNumber : null,
      );
      if (defaults.deliverySettingsError || defaults.buyingRulesError) {
        await supabase.from("firm_users").update({ user_id: null }).eq("id", existingUser.id);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json({ error: "Failed to initialize firm settings" }, { status: 500 });
      }

      if (notificationTargets.error) {
        await supabase.from("firm_users").update({ user_id: null }).eq("id", existingUser.id);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json({ error: "Failed to create notification targets" }, { status: 500 });
      }

      return NextResponse.json({ success: true, linked: true });
    }

    const { data: firm, error: firmError } = await supabase
      .from("firms")
      .insert({
        name: firmName,
        status: "pending_verification",
        payment_status: "missing",
        has_valid_payment_method: false,
        approved_at: null,
        gated_until: null,
        approval_email_sent_at: null,
        welcome_email_sent_at: null,
        states_covered: statesCoveredTarget.normalizedValue,
        bar_number: typeof barNumber === "string" ? barNumber.trim() || null : null,
        bar_state: barStateTarget.normalizedValue || null,
        website_url: websiteTarget.normalizedValue || null,
        primary_contact_phone: typeof phoneNumber === "string" ? phoneNumber.trim() || null : null,
        primary_contact_title: typeof title === "string" ? title.trim() || null : null,
        practice_areas: Array.isArray(practiceAreas)
          ? practiceAreas
              .map((value: unknown) => String(value).trim())
              .filter(Boolean)
          : typeof practiceAreas === "string"
            ? practiceAreas
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            : [],
        support_notes: typeof supportNotes === "string" ? supportNotes.trim() || null : null,
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
      phone_number: typeof phoneNumber === "string" ? phoneNumber.trim() || null : null,
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

    const notificationTargets = await ensureNotificationTargets(
      supabase,
      firm.id,
      email,
      typeof phoneNumber === "string" ? phoneNumber : null,
    );

    if (notificationTargets.error) {
      await supabase.from("firm_buying_rules").delete().eq("firm_id", firm.id);
      await supabase.from("firm_delivery_settings").delete().eq("firm_id", firm.id);
      await supabase.from("firm_users").delete().eq("firm_id", firm.id);
      await supabase.from("firms").delete().eq("id", firm.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: "Failed to create notification targets" }, { status: 500 });
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
