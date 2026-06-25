import { NextRequest, NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name, firmName, barNumber, barState, statesCovered } =
    await request.json();

  const service = createServiceClient();

  const { data: firmUser } = await service
    .from("firm_users")
    .select("firm_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!firmUser) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  if (firmName) {
    await service
      .from("firms")
      .update({
        name: firmName,
        ...(barNumber !== undefined ? { bar_number: barNumber || null } : {}),
        ...(barState !== undefined ? { bar_state: barState || null } : {}),
        ...(statesCovered !== undefined
          ? { states_covered: statesCovered }
          : {}),
      })
      .eq("id", firmUser.firm_id);
  }

  const { error } = await service
    .from("firm_users")
    .update({
      terms_accepted_at: new Date().toISOString(),
      ...(name ? { name } : {}),
    })
    .eq("auth_user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to accept terms" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
