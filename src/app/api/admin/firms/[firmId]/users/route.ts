import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verifyAdminKey } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ firmId: string }> },
) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { firmId } = await params;
  const body = await request.json();
  const { email, name, role } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: firm } = await supabase
    .from("firms")
    .select("id")
    .eq("id", firmId)
    .single();

  if (!firm) {
    return NextResponse.json({ error: "Firm not found" }, { status: 404 });
  }

  const { data: firmUser, error } = await supabase
    .from("firm_users")
    .insert({
      firm_id: firmId,
      email: email.toLowerCase().trim(),
      name: name || null,
      role: role || "owner",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ firmUser }, { status: 201 });
}
