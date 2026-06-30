import { Meta } from "@once-ui-system/core";
import DashboardClient from "./dashboard-client";

export async function generateMetadata() {
  return Meta.generate({
    title: "Dashboard | Semperr",
    description: "Firm dashboard with payment and lead delivery status.",
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || "https://semperr.com",
    path: "/dashboard",
  });
}

export default function DashboardPage() {
  return <DashboardClient />;
}
