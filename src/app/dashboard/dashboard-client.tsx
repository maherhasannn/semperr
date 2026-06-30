"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Column, Heading, Line, Row, Text } from "@once-ui-system/core";
import { getSupabase } from "@/lib/supabase";
import {
  calculateRemainingBudget,
  getFirmPaymentMessage,
  normalizeBuyingRuleList,
} from "@/lib/firm-eligibility";
import type { Firm, FirmBuyingRules, FirmUser } from "@/types/firm.types";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type DashboardState = {
  userName: string;
  role: string;
  firm: Pick<
    Firm,
    "id" | "name" | "status" | "payment_status" | "has_valid_payment_method" | "stripe_customer_id" | "created_at"
  >;
  buyingRules: FirmBuyingRules;
  leadHistory: Array<{
    id: string;
    state: string;
    case_type: string;
    claimant_name: string | null;
    price_cents: number;
    delivered_at: string | null;
  }>;
  remainingBudgetCents: number;
};

export default function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<DashboardState | null>(null);
  const [draftStates, setDraftStates] = useState("");
  const [draftCaseTypes, setDraftCaseTypes] = useState("");
  const [draftMinPrice, setDraftMinPrice] = useState("0");
  const [draftMaxPrice, setDraftMaxPrice] = useState("0");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: membership } = await supabase
        .from("firm_users")
        .select("firm_id, role, name, email")
        .eq("user_id", user.id)
        .maybeSingle<FirmUser>();

      if (!membership) {
        if (!active) return;
        setError("This account is not linked to a firm yet.");
        setLoading(false);
        return;
      }

      const firmId = membership.firm_id;

      const [
        firmResult,
        rulesResult,
        leadHistoryResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from("firms")
          .select(
            "id, name, status, payment_status, has_valid_payment_method, stripe_customer_id, created_at",
          )
          .eq("id", firmId)
          .single(),
        supabase
          .from("firm_buying_rules")
          .select("id, firm_id, states, case_types, min_price_cents, max_price_cents, created_at")
          .eq("firm_id", firmId)
          .maybeSingle(),
        supabase
          .from("leads")
          .select("id, state, case_type, claimant_name, price_cents, delivered_at")
          .eq("firm_id", firmId)
          .order("delivered_at", { ascending: false }),
        supabase.from("transactions").select("amount_cents").eq("firm_id", firmId),
      ]);

      if (!active) return;

      if (firmResult.error || !firmResult.data) {
        setError("We could not load your firm record.");
        setLoading(false);
        return;
      }

      const firm = firmResult.data;
      const buyingRules =
        rulesResult.data ??
        ({
          id: "",
          firm_id: firmId,
          states: [],
          case_types: [],
          min_price_cents: 0,
          max_price_cents: 0,
          created_at: firm.created_at,
        } satisfies FirmBuyingRules);

      setState({
        userName: membership.name || membership.email || "there",
        role: membership.role,
        firm,
        buyingRules,
        leadHistory: (leadHistoryResult.data || []) as DashboardState["leadHistory"],
        remainingBudgetCents: calculateRemainingBudget(transactionsResult.data || []),
      });
      setDraftStates((buyingRules.states || []).join(", "));
      setDraftCaseTypes((buyingRules.case_types || []).join(", "));
      setDraftMinPrice(String(buyingRules.min_price_cents || 0));
      setDraftMaxPrice(String(buyingRules.max_price_cents || 0));
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleSaveBuyingRules = async () => {
    if (!state) return;

    setSavingRules(true);
    setSaveMessage(null);

    const supabase = getSupabase();
    const { error: upsertError } = await supabase
      .from("firm_buying_rules")
      .upsert(
        {
          firm_id: state.firm.id,
          states: normalizeBuyingRuleList(draftStates),
          case_types: normalizeBuyingRuleList(draftCaseTypes),
          min_price_cents: Number.parseInt(draftMinPrice, 10) || 0,
          max_price_cents: Number.parseInt(draftMaxPrice, 10) || 0,
        },
        { onConflict: "firm_id" },
      );

    if (upsertError) {
      setSaveMessage(upsertError.message);
      setSavingRules(false);
      return;
    }

    setState((current) =>
      current
        ? {
            ...current,
            buyingRules: {
              ...current.buyingRules,
              states: normalizeBuyingRuleList(draftStates),
              case_types: normalizeBuyingRuleList(draftCaseTypes),
              min_price_cents: Number.parseInt(draftMinPrice, 10) || 0,
              max_price_cents: Number.parseInt(draftMaxPrice, 10) || 0,
            },
          }
        : current,
    );
    setSaveMessage("Buying rules saved.");
    setSavingRules(false);
  };

  if (loading) {
    return (
      <Column maxWidth="m" gap="20" paddingY="xl">
        <Heading as="h1" variant="display-strong-s">
          Loading dashboard
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Verifying your session and loading firm data.
        </Text>
      </Column>
    );
  }

  if (error || !state) {
    return (
      <Column maxWidth="s" gap="20" paddingY="xl">
        <Heading as="h1" variant="display-strong-s">
          Dashboard unavailable
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          {error || "Something went wrong."}
        </Text>
        <Button href="/login" variant="secondary" size="m">
          Back to login
        </Button>
      </Column>
    );
  }

  const { firm, buyingRules, remainingBudgetCents, leadHistory } = state;
  const paymentMessage = getFirmPaymentMessage(firm);
  const paymentActive = firm.has_valid_payment_method && firm.payment_status === "valid";
  const paused = firm.status !== "active" || !paymentActive || remainingBudgetCents <= 0;

  return (
    <Column
      maxWidth="l"
      gap="24"
      paddingY="xl"
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <Column gap="8">
        <Text
          variant="label-default-s"
          onBackground="neutral-weak"
          style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          Firm dashboard
        </Text>
        <Heading as="h1" variant="display-strong-s">
          {firm.name}
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Welcome back, {state.userName}. Lead history, payment status, and buying rules are shown here.
        </Text>
      </Column>

      <Column
        fillWidth
        gap="24"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
        s={{ direction: "column" }}
      >
        <Column
          gap="20"
          padding="32"
          radius="l"
          border="neutral-alpha-weak"
          background="neutral-alpha-weak"
        >
          <Row fillWidth horizontal="between" vertical="center">
            <Text variant="body-strong-s" onBackground="neutral-strong">
              Payment status
            </Text>
            <Badge background={paused ? "surface" : "brand-alpha-weak"} onBackground="neutral-strong">
              {paused ? "Paused" : "Active"}
            </Badge>
          </Row>
          <Text variant="body-default-m" onBackground="neutral-weak">
            {paymentMessage}
          </Text>
          <Line fillWidth background="neutral-alpha-weak" />
          <Row fillWidth horizontal="between">
            <Text variant="body-default-s" onBackground="neutral-weak">
              Stripe customer
            </Text>
            <Text variant="body-default-s" onBackground="neutral-strong">
              {firm.stripe_customer_id || "Not set"}
            </Text>
          </Row>
          <Row fillWidth horizontal="between">
            <Text variant="body-default-s" onBackground="neutral-weak">
              Remaining budget
            </Text>
            <Text variant="body-default-s" onBackground="neutral-strong">
              {formatCurrency(Math.max(remainingBudgetCents, 0))}
            </Text>
          </Row>
          <Button href="/dashboard/billing" variant="secondary" size="m">
            Add Payment Method
          </Button>
        </Column>

        <Column flex={1} gap="16" padding="32" radius="l" border="neutral-alpha-weak" background="neutral-alpha-weak">
          <Text variant="body-strong-s" onBackground="neutral-strong">
            Buying rules
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Edit only your firm-owned buying preferences. State approval and ranking are managed by Semperr.
          </Text>
          <Column gap="12">
            <div>
              <label className="auth-label" htmlFor="buying-states">
                States
              </label>
              <input
                id="buying-states"
                className="auth-input"
                value={draftStates}
                onChange={(e) => setDraftStates(e.target.value)}
                placeholder="CA, TX, FL"
              />
            </div>
            <div>
              <label className="auth-label" htmlFor="buying-cases">
                Case types
              </label>
              <input
                id="buying-cases"
                className="auth-input"
                value={draftCaseTypes}
                onChange={(e) => setDraftCaseTypes(e.target.value)}
                placeholder="workers_comp, personal_injury"
              />
            </div>
            <Row fillWidth gap="12" s={{ direction: "column" }}>
              <div style={{ flex: 1 }}>
                <label className="auth-label" htmlFor="buying-min-price">
                  Min price
                </label>
                <input
                  id="buying-min-price"
                  className="auth-input"
                  type="number"
                  min="0"
                  value={draftMinPrice}
                  onChange={(e) => setDraftMinPrice(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="auth-label" htmlFor="buying-max-price">
                  Max price
                </label>
                <input
                  id="buying-max-price"
                  className="auth-input"
                  type="number"
                  min="0"
                  value={draftMaxPrice}
                  onChange={(e) => setDraftMaxPrice(e.target.value)}
                />
              </div>
            </Row>
          </Column>
          <Button
            variant="secondary"
            size="m"
            onClick={handleSaveBuyingRules}
            disabled={savingRules}
          >
            {savingRules ? "Saving…" : "Save buying rules"}
          </Button>
          {saveMessage && (
            <Text variant="body-default-s" onBackground="neutral-weak">
              {saveMessage}
            </Text>
          )}
          <Line fillWidth background="neutral-alpha-weak" />
          <Text variant="body-default-s" onBackground="neutral-weak">
            Current rules: {buyingRules.states.length > 0 ? buyingRules.states.join(", ") : "Any states"} ·{" "}
            {buyingRules.case_types.length > 0 ? buyingRules.case_types.join(", ") : "Any case types"} ·{" "}
            {buyingRules.min_price_cents > 0 ? formatCurrency(buyingRules.min_price_cents) : "No minimum"} to{" "}
            {buyingRules.max_price_cents > 0 ? formatCurrency(buyingRules.max_price_cents) : "No maximum"}
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Lead routing eligibility is enforced server-side. Buying-rule matching is not trusted to the frontend.
          </Text>
        </Column>
      </Column>

      <Column gap="16" padding="32" radius="l" border="neutral-alpha-weak" background="neutral-alpha-weak">
        <Row fillWidth horizontal="between" vertical="center">
          <Text variant="body-strong-s" onBackground="neutral-strong">
            Lead history
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Delivered leads for this firm
          </Text>
        </Row>
        <Line fillWidth background="neutral-alpha-weak" />
        {leadHistory.length > 0 ? (
          leadHistory.map((lead) => (
            <Row
              key={lead.id}
              fillWidth
              horizontal="between"
              vertical="center"
              gap="16"
              s={{ direction: "column", align: "start" }}
            >
              <Column gap="4">
                <Text variant="body-strong-s" onBackground="neutral-strong">
                  {lead.claimant_name || "New lead"} · {lead.state}
                </Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  {lead.case_type} · {formatCurrency(lead.price_cents)}
                </Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  Delivered: {lead.delivered_at ? new Date(lead.delivered_at).toLocaleString() : "N/A"}
                </Text>
              </Column>
            </Row>
          ))
        ) : (
          <Text variant="body-default-m" onBackground="neutral-weak">
            No lead history yet.
          </Text>
        )}
      </Column>

      <Column fillWidth horizontal="between" vertical="center" gap="16">
        <Text variant="body-default-s" onBackground="neutral-weak">
          Access is limited to {state.role} users in this firm.
        </Text>
        <Row gap="16" vertical="center">
          <Button href="/dashboard/billing" variant="secondary" size="m">
            Add Payment Method
          </Button>
          <Button variant="tertiary" size="m" onClick={handleSignOut}>
            Sign out
          </Button>
        </Row>
      </Column>

      <style jsx>{`
        .auth-label {
          display: block;
          font-size: 13px;
          color: #aab0b7;
          margin-bottom: 8px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .auth-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          color: #f2f4f5;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }

        .auth-input::placeholder {
          color: #4a5058;
        }

        .auth-input:focus {
          border-color: rgba(91, 225, 239, 0.45);
          background: rgba(255, 255, 255, 0.035);
          box-shadow: 0 0 0 3px rgba(91, 225, 239, 0.08), 0 0 20px rgba(91, 225, 239, 0.04);
        }
      `}</style>
    </Column>
  );
}
