"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Column,
  Heading,
  Text,
  Button,
  Row,
  SmartLink,
  Spinner,
} from "@once-ui-system/core";
import { getSupabase } from "@/lib/supabase";
import type { Firm, FirmUser } from "@/types/firm.types";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [firmUser, setFirmUser] = useState<FirmUser | null>(null);
  const [balanceCents, setBalanceCents] = useState<number>(0);

  useEffect(() => {
    const init = async () => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: fu } = await supabase
        .from("firm_users")
        .select("*, firms(*)")
        .eq("auth_user_id", user.id)
        .single();

      if (!fu) {
        router.replace("/login");
        return;
      }

      if (!fu.onboarding_completed) {
        router.replace("/onboarding");
        return;
      }

      setFirmUser(fu);
      setFirm(fu.firms as unknown as Firm);

      const { data: balance } = await supabase
        .from("firm_balances")
        .select("balance_cents")
        .eq("firm_id", fu.firm_id)
        .single();

      setBalanceCents(balance?.balance_cents ?? 0);
      setLoading(false);
    };

    init();
  }, [router]);

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <Column
        fill
        horizontal="center"
        vertical="center"
        style={{ minHeight: "100vh" }}
      >
        <Spinner />
      </Column>
    );
  }

  const firstName = firmUser?.name?.split(" ")[0] || "there";
  const balanceFormatted = `$${(balanceCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <Column fillWidth padding="xl" style={{ minHeight: "100vh" }}>
      <Column fillWidth maxWidth="l" gap="xl" style={{ margin: "0 auto" }}>
        <Row fillWidth horizontal="between" vertical="center">
          <SmartLink href="/" style={{ textDecoration: "none" }}>
            <Text
              variant="heading-default-s"
              onBackground="neutral-weak"
              style={{
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: 400,
              }}
            >
              Semperr
            </Text>
          </SmartLink>
          <Button variant="tertiary" size="s" onClick={handleSignOut}>
            Sign out
          </Button>
        </Row>

        <Column gap="s">
          <Heading variant="display-strong-xs">
            Welcome back, {firstName}
          </Heading>
          <Text variant="body-default-l" onBackground="neutral-weak">
            {firm?.name}
          </Text>
        </Column>

        {firm?.status !== "active" && (
          <Column
            fillWidth
            padding="l"
            radius="l"
            border="warning-alpha-medium"
            background="surface"
            gap="8"
          >
            <Text variant="label-strong-s" onBackground="warning-strong">
              Account pending activation
            </Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              Your account is set up and funded. Our team will activate it
              shortly and you'll begin receiving cases.
            </Text>
          </Column>
        )}

        <Row fillWidth gap="16">
          <Column
            flex={1}
            padding="l"
            radius="l"
            border="neutral-alpha-weak"
            background="surface"
            gap="4"
          >
            <Text variant="label-default-s" onBackground="neutral-weak">
              Balance
            </Text>
            <Text
              variant="heading-strong-l"
              onBackground={
                balanceCents > 0 ? "brand-strong" : "danger-strong"
              }
            >
              {balanceFormatted}
            </Text>
          </Column>
          <Column
            flex={1}
            padding="l"
            radius="l"
            border="neutral-alpha-weak"
            background="surface"
            gap="4"
          >
            <Text variant="label-default-s" onBackground="neutral-weak">
              Cases delivered
            </Text>
            <Text variant="heading-strong-l">0</Text>
          </Column>
        </Row>

        <Column
          fillWidth
          padding="xl"
          radius="l"
          border="neutral-alpha-weak"
          background="surface"
          horizontal="center"
          vertical="center"
          gap="m"
          style={{ minHeight: "200px" }}
        >
          <Text
            variant="body-default-l"
            onBackground="neutral-weak"
            align="center"
          >
            Your cases will appear here once delivery begins.
          </Text>
        </Column>
      </Column>
    </Column>
  );
}
