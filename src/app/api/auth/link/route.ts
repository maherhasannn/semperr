import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const { userId, email } = await request.json();

  if (!userId || !email) {
    return NextResponse.json(
      { error: "userId and email required" },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  const { data: existing } = await service
    .from("firm_users")
    .select("id, onboarding_completed")
    .eq("auth_user_id", userId)
    .single();

  if (existing) {
    return NextResponse.json({
      linked: true,
      onboardingCompleted: existing.onboarding_completed,
    });
  }

  const { data: firmUser, error } = await service
    .from("firm_users")
    .update({ auth_user_id: userId })
    .eq("email", email.toLowerCase().trim())
    .is("auth_user_id", null)
    .select("id, onboarding_completed")
    .single();

  if (error || !firmUser) {
    return NextResponse.json(
      { error: "No invite found for this email" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    linked: true,
    onboardingCompleted: firmUser.onboarding_completed,
  });
}
