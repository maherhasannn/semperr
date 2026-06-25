import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceClient();

  const { data: firmUser } = await supabase
    .from("firm_users")
    .select("id, firm_id, firms(name)")
    .eq("email", normalizedEmail)
    .single();

  if (firmUser) {
    const firm = firmUser.firms as unknown as { name: string } | null;
    return NextResponse.json({
      exists: true,
      firmName: firm?.name ?? null,
    });
  }

  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .insert({ name: "Pending Setup", states_covered: [] })
    .select()
    .single();

  if (firmError || !firm) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }

  const { error: userError } = await supabase.from("firm_users").insert({
    firm_id: firm.id,
    email: normalizedEmail,
    role: "owner",
  });

  if (userError) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    exists: true,
    firmName: null,
    isNew: true,
  });
}
