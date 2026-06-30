import Link from "next/link";
import { Button, Column, Heading, Meta, Text } from "@once-ui-system/core";

export async function generateMetadata() {
  return Meta.generate({
    title: "Billing | Semperr",
    description: "Placeholder billing page for payment method setup.",
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || "https://semperr.com",
    path: "/dashboard/billing",
  });
}

export default function BillingPage() {
  return (
    <Column maxWidth="s" gap="20" paddingY="xl">
      <Heading as="h1" variant="display-strong-s">
        Add Payment Method
      </Heading>
      <Text variant="body-default-m" onBackground="neutral-weak">
        Stripe checkout is not enabled in this project yet. This page is a placeholder so the dashboard
        can expose the billing entry point without trusting the frontend to flip payment flags.
      </Text>
      <Text variant="body-default-s" onBackground="neutral-weak">
        TODO: wire a secure server-side Checkout or SetupIntent flow when billing is configured.
      </Text>
      <Button href="/dashboard" variant="secondary" size="m">
        Back to dashboard
      </Button>
      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <Text variant="body-default-s" onBackground="neutral-strong">
          Return to account status
        </Text>
      </Link>
    </Column>
  );
}
