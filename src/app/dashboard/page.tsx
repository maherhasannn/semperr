import { Meta } from "@once-ui-system/core";
import { redirect } from "next/navigation";
import { createRouteClient } from "@/lib/supabase-server";
import DashboardClient from "./dashboard-client";

export async function generateMetadata() {
  return Meta.generate({
    title: "Dashboard | Semperr",
    description: "Firm dashboard with payment and lead delivery status.",
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || "https://semperr.com",
    path: "/dashboard",
  });
}

export default async function DashboardPage() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient />;
}
