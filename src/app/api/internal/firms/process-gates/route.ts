import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendFirmActivatedEmail } from "@/lib/email";

function isAuthorized(request: Request) {
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return false;

  const provided =
    request.headers.get("x-admin-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  return provided === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  const { data: firms, error } = await supabase
    .from("firms")
    .select("id, name, tier, gated_until, welcome_email_sent_at")
    .not("approved_at", "is", null)
    .lte("gated_until", now.toISOString())
    .is("welcome_email_sent_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activated: Array<{ firmId: string; email: string }> = [];
  const failures: Array<{ firmId: string; error: string }> = [];

  for (const firm of firms || []) {
    const { data: users, error: usersError } = await supabase
      .from("firm_users")
      .select("email, name, role")
      .eq("firm_id", firm.id);

    if (usersError) {
      failures.push({ firmId: firm.id, error: usersError.message });
      continue;
    }

    const recipient = (users || []).find((user) => user.role === "owner" && user.email) || (users || [])[0];

    if (!recipient?.email) {
      failures.push({ firmId: firm.id, error: "No recipient email found" });
      continue;
    }

    try {
      await sendFirmActivatedEmail(recipient.email, firm.name, recipient.name ?? null, firm.tier);

      const { error: updateError } = await supabase
        .from("firms")
        .update({
          status: "active",
          welcome_email_sent_at: new Date().toISOString(),
        })
        .eq("id", firm.id);

      if (updateError) {
        failures.push({ firmId: firm.id, error: updateError.message });
        continue;
      }

      activated.push({ firmId: firm.id, email: recipient.email });
    } catch (sendError) {
      failures.push({
        firmId: firm.id,
        error: sendError instanceof Error ? sendError.message : "Unknown email error",
      });
    }
  }

  return NextResponse.json({
    success: true,
    activated,
    failures,
  });
}
