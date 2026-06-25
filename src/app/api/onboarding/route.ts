import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: firmUser } = await service
    .from("firm_users")
    .select("*, firms(*)")
    .eq("auth_user_id", user.id)
    .single();

  if (!firmUser) {
    const { data: firmUserByEmail } = await service
      .from("firm_users")
      .select("*, firms(*)")
      .eq("email", user.email!)
      .single();

    if (!firmUserByEmail) {
      return NextResponse.json(
        { error: "No firm account found" },
        { status: 404 },
      );
    }

    if (!firmUserByEmail.auth_user_id) {
      await service
        .from("firm_users")
        .update({ auth_user_id: user.id })
        .eq("id", firmUserByEmail.id);
    }

    return NextResponse.json({
      firmUser: {
        id: firmUserByEmail.id,
        firm_id: firmUserByEmail.firm_id,
        email: firmUserByEmail.email,
        name: firmUserByEmail.name,
        role: firmUserByEmail.role,
        onboarding_completed: firmUserByEmail.onboarding_completed,
        terms_accepted_at: firmUserByEmail.terms_accepted_at,
      },
      firm: firmUserByEmail.firms,
    });
  }

  return NextResponse.json({
    firmUser: {
      id: firmUser.id,
      firm_id: firmUser.firm_id,
      email: firmUser.email,
      name: firmUser.name,
      role: firmUser.role,
      onboarding_completed: firmUser.onboarding_completed,
      terms_accepted_at: firmUser.terms_accepted_at,
    },
    firm: firmUser.firms,
  });
}
