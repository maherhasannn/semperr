import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verifyAdminKey } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, states_covered, bar_number, bar_state } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Firm name is required" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: firm, error } = await supabase
    .from("firms")
    .insert({
      name,
      states_covered: states_covered || [],
      bar_number: bar_number || null,
      bar_state: bar_state || null,
      tier: 2,
      status: "pending_verification",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ firm }, { status: 201 });
}

export async function GET(request: NextRequest) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: firms, error } = await supabase
    .from("firms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ firms });
}
