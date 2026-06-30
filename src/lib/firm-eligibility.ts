import type { Firm, FirmBuyingRules, FirmDeliverySettings } from "@/types/firm.types";

export type FirmRoutingSnapshot = Pick<
  Firm,
  "status" | "payment_status" | "has_valid_payment_method"
> & {
  remaining_budget_cents: number;
  lead_price_cents: number;
  daily_leads_delivered: number;
  monthly_leads_delivered: number;
};

export type FirmRoutingDecision = {
  eligible: boolean;
  pausedReason: string | null;
};

export function calculateRemainingBudget(transactions: Array<{ amount_cents: number }>): number {
  return transactions.reduce((total, transaction) => total + transaction.amount_cents, 0);
}

export function normalizeStateCode(state: string) {
  return state.trim().toUpperCase();
}

export function normalizeBuyingRuleList(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.toUpperCase());
}

export function matchesBuyingRules(
  buyingRules: Pick<FirmBuyingRules, "states" | "case_types" | "min_price_cents" | "max_price_cents">,
  lead: { state: string; case_type: string; price_cents: number },
) {
  const state = normalizeStateCode(lead.state);
  const caseType = lead.case_type.trim().toLowerCase();
  const stateAllowed =
    buyingRules.states.length === 0 || buyingRules.states.map(normalizeStateCode).includes(state);
  const caseTypeAllowed =
    buyingRules.case_types.length === 0 ||
    buyingRules.case_types.map((value) => value.trim().toLowerCase()).includes(caseType);
  const minPriceAllowed =
    buyingRules.min_price_cents <= 0 || lead.price_cents >= buyingRules.min_price_cents;
  const maxPriceAllowed =
    buyingRules.max_price_cents <= 0 || lead.price_cents <= buyingRules.max_price_cents;

  return stateAllowed && caseTypeAllowed && minPriceAllowed && maxPriceAllowed;
}

export function getFirmPaymentMessage(firm: Pick<Firm, "payment_status" | "has_valid_payment_method">) {
  if (firm.payment_status === "card_failed") {
    return "Paused: card failed";
  }

  if (!firm.has_valid_payment_method) {
    return "Lead delivery is paused until a valid payment method is added.";
  }

  switch (firm.payment_status) {
    case "invalid":
      return "Paused: missing or invalid payment method";
    case "missing":
      return "Paused: missing or invalid payment method";
    case "valid":
    default:
      return "Active: valid payment method on file";
  }
}

export function evaluateFirmRoutingEligibility(
  firm: Pick<Firm, "status" | "payment_status" | "has_valid_payment_method">,
  deliverySettings: Pick<FirmDeliverySettings, "lead_delivery_enabled" | "daily_cap" | "monthly_cap">,
  snapshot: FirmRoutingSnapshot,
): FirmRoutingDecision {
  if (firm.status !== "active") {
    return { eligible: false, pausedReason: "Paused: firm is not active" };
  }

  if (!firm.has_valid_payment_method || firm.payment_status !== "valid") {
    return { eligible: false, pausedReason: getFirmPaymentMessage(firm) };
  }

  if (!deliverySettings.lead_delivery_enabled) {
    return { eligible: false, pausedReason: "Paused: lead delivery is disabled" };
  }

  if (deliverySettings.daily_cap > 0 && snapshot.daily_leads_delivered >= deliverySettings.daily_cap) {
    return { eligible: false, pausedReason: "Paused: daily cap reached" };
  }

  if (
    deliverySettings.monthly_cap > 0 &&
    snapshot.monthly_leads_delivered >= deliverySettings.monthly_cap
  ) {
    return { eligible: false, pausedReason: "Paused: monthly cap reached" };
  }

  if (snapshot.remaining_budget_cents < snapshot.lead_price_cents) {
    return { eligible: false, pausedReason: "Paused: budget exhausted" };
  }

  return { eligible: true, pausedReason: null };
}

// TODO: move the eligibility check into a Supabase Edge Function so lead routing never
// depends on client-side state or a dashboard-only approximation.
