import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendFirmApprovedEmail } from "@/lib/email";

function isAuthorized(request: Request) {
  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return false;

  const provided =
    request.headers.get("x-admin-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  return provided === secret;
}

export async function POST(
  request: Request,
  context: { params: { firmId: string } | Promise<{ firmId: string }> },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { firmId } = await context.params;
  const supabase = createServiceClient();

  const [{ data: firm, error: firmError }, { data: users, error: usersError }] = await Promise.all([
    supabase
      .from("firms")
      .select("id, name, tier, approved_at, gated_until, approval_email_sent_at")
      .eq("id", firmId)
      .maybeSingle(),
    supabase
      .from("firm_users")
      .select("email, name, role, user_id")
      .eq("firm_id", firmId),
  ]);

  if (firmError || !firm) {
    return NextResponse.json({ error: "Firm not found" }, { status: 404 });
  }

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const recipient = (users || []).find((user) => user.role === "owner" && user.email) || (users || [])[0];

  if (!recipient?.email) {
    return NextResponse.json({ error: "No firm recipient email found" }, { status: 400 });
  }

  const now = new Date();
  const gatedUntil = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const shouldSendApprovalEmail = !firm.approval_email_sent_at;

  const { error: updateError } = await supabase
    .from("firms")
    .update({
      approved_at: now.toISOString(),
      gated_until: gatedUntil.toISOString(),
    })
    .eq("id", firmId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (shouldSendApprovalEmail) {
    try {
      await sendFirmApprovedEmail(recipient.email, firm.name, recipient.name ?? null, firm.tier);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Approval recorded, but the approval email could not be sent.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 502 },
      );
    }

    await supabase
      .from("firms")
      .update({
        approval_email_sent_at: now.toISOString(),
      })
      .eq("id", firmId);
  }

  return NextResponse.json({
    success: true,
    firmId,
    gatedUntil: gatedUntil.toISOString(),
  });
}
