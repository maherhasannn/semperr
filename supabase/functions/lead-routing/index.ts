import { createClient } from "npm:@supabase/supabase-js@2";

type LeadPayload = {
  state: string;
  case_type: string;
  claimant_name: string | null;
  claimant_contact: string | null;
  claimant_phone?: string | null;
  claimant_email?: string | null;
  price_cents: number;
  source_doc?: string | null;
};

type RoutingFirm = {
  id: string;
  name: string;
  status: string;
  payment_status: string;
  has_valid_payment_method: boolean;
};

type RoutingAssignment = {
  state: string;
  firm_id: string;
  rank: number;
  status: string;
};

type RoutingDelivery = {
  firm_id: string;
  lead_delivery_enabled: boolean;
  daily_cap: number;
  monthly_cap: number;
};

type RoutingRules = {
  firm_id: string;
  states: string[];
  case_types: string[];
  min_price_cents: number;
  max_price_cents: number;
};

type RoutingTransaction = {
  firm_id: string;
  amount_cents: number;
};

type DeliveryTarget = {
  email: string;
  phone_number: string | null;
  name: string | null;
  role: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeStateCode(state: string) {
  return state.trim().toUpperCase();
}

function normalizeRuleList(values: string[] | null | undefined) {
  return (values || []).map((value) => value.trim()).filter(Boolean);
}

function matchesBuyingRules(
  buyingRules: Pick<RoutingRules, "states" | "case_types" | "min_price_cents" | "max_price_cents">,
  lead: { state: string; case_type: string; price_cents: number },
) {
  const state = normalizeStateCode(lead.state);
  const caseType = lead.case_type.trim().toLowerCase();
  const stateAllowed =
    buyingRules.states.length === 0 || buyingRules.states.map(normalizeStateCode).includes(state);
  const caseTypeAllowed =
    buyingRules.case_types.length === 0 ||
    buyingRules.case_types.map((value) => value.trim().toLowerCase()).includes(caseType);
  const minPriceAllowed = buyingRules.min_price_cents <= 0 || lead.price_cents >= buyingRules.min_price_cents;
  const maxPriceAllowed = buyingRules.max_price_cents <= 0 || lead.price_cents <= buyingRules.max_price_cents;
  return stateAllowed && caseTypeAllowed && minPriceAllowed && maxPriceAllowed;
}

function combineLeadContact(phone: string | null | undefined, email: string | null | undefined) {
  return [phone?.trim(), email?.trim()].filter(Boolean).join(" | ") || null;
}

async function recordLeadWaste(
  supabase: ReturnType<typeof createClient>,
  lead: LeadPayload,
  reason: string,
) {
  const { error } = await supabase.from("lead_waste").insert({
    state: lead.state,
    case_type: lead.case_type,
    price_cents: lead.price_cents,
    claimant_name: lead.claimant_name,
    claimant_contact: lead.claimant_contact || combineLeadContact(lead.claimant_phone, lead.claimant_email),
    reason,
    source_doc: lead.source_doc || null,
  });

  if (error) throw new Error(error.message);
}

async function loadDeliveryTargets(supabase: ReturnType<typeof createClient>, firmId: string) {
  const { data, error } = await supabase
    .from("firm_users")
    .select("email, phone_number, name, role")
    .eq("firm_id", firmId)
    .in("role", ["owner", "admin"]);

  if (error) throw new Error(error.message);

  const targets: DeliveryTarget[] = [];
  const seen = new Set<string>();
  for (const row of (data || []) as DeliveryTarget[]) {
    const email = row.email.trim();
    if (!email || seen.has(email.toLowerCase())) continue;
    seen.add(email.toLowerCase());
    targets.push(row);
  }

  return targets;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = Deno.env.get("LEAD_ROUTING_WEBHOOK_SECRET");

    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (webhookSecret) {
      const providedSecret = req.headers.get("x-webhook-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (providedSecret !== webhookSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const payload = (await req.json()) as LeadPayload;
    const lead = {
      state: payload.state,
      case_type: payload.case_type,
      claimant_name: payload.claimant_name ?? null,
      claimant_phone: payload.claimant_phone ?? null,
      claimant_email: payload.claimant_email ?? null,
      claimant_contact: payload.claimant_contact ?? null,
      price_cents: payload.price_cents,
      source_doc: payload.source_doc ?? null,
    };

    const [firmsResult, assignmentsResult, deliveryResult, rulesResult, leadsResult, transactionsResult] =
      await Promise.all([
        supabase.from("firms").select("id, name, status, payment_status, has_valid_payment_method"),
        supabase
          .from("state_exclusivity")
          .select("state, firm_id, rank, status")
          .eq("status", "approved")
          .eq("state", normalizeStateCode(lead.state))
          .order("rank", { ascending: true }),
        supabase.from("firm_delivery_settings").select("firm_id, lead_delivery_enabled, daily_cap, monthly_cap"),
        supabase.from("firm_buying_rules").select("firm_id, states, case_types, min_price_cents, max_price_cents"),
        supabase.from("leads").select("firm_id, created_at"),
        supabase.from("transactions").select("firm_id, amount_cents"),
      ]);

    for (const result of [firmsResult, assignmentsResult, deliveryResult, rulesResult, leadsResult, transactionsResult]) {
      if (result.error) throw new Error(result.error.message);
    }

    const firmsById = new Map(((firmsResult.data || []) as RoutingFirm[]).map((firm) => [firm.id, firm]));
    const assignments = (assignmentsResult.data || []) as RoutingAssignment[];
    const deliveryByFirmId = new Map(((deliveryResult.data || []) as RoutingDelivery[]).map((row) => [row.firm_id, row]));
    const rulesByFirmId = new Map(((rulesResult.data || []) as RoutingRules[]).map((row) => [row.firm_id, row]));
    const remainingBudgetByFirmId = new Map<string, number>();
    const dailyLeadCountByFirmId = new Map<string, number>();
    const monthlyLeadCountByFirmId = new Map<string, number>();

    for (const transaction of (transactionsResult.data || []) as RoutingTransaction[]) {
      remainingBudgetByFirmId.set(
        transaction.firm_id,
        (remainingBudgetByFirmId.get(transaction.firm_id) || 0) + transaction.amount_cents,
      );
    }

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const item of (leadsResult.data || []) as Array<{ firm_id: string; created_at: string }>) {
      const createdAt = new Date(item.created_at);
      if (createdAt >= dayStart) {
        dailyLeadCountByFirmId.set(item.firm_id, (dailyLeadCountByFirmId.get(item.firm_id) || 0) + 1);
      }
      if (createdAt >= monthStart) {
        monthlyLeadCountByFirmId.set(item.firm_id, (monthlyLeadCountByFirmId.get(item.firm_id) || 0) + 1);
      }
    }

    const rankedAssignments = assignments
      .map((assignment) => ({
        ...assignment,
        firm: firmsById.get(assignment.firm_id),
        delivery: deliveryByFirmId.get(assignment.firm_id),
        rules: rulesByFirmId.get(assignment.firm_id),
      }))
      .filter((row) => row.firm && row.delivery && row.rules);

    let chosen:
      | {
          firm_id: string;
          rank: number;
          firm_name: string;
        }
      | null = null;
    let reason = "No ranked firm qualified for this state";

    for (const row of rankedAssignments) {
      const firm = row.firm as RoutingFirm;
      const delivery = row.delivery as RoutingDelivery;
      const rules = row.rules as RoutingRules;

      if (firm.status !== "active") {
        reason = "Firm is not active";
        continue;
      }

      if (!firm.has_valid_payment_method || firm.payment_status !== "valid") {
        reason = "Payment is invalid or missing";
        continue;
      }

      if (!delivery.lead_delivery_enabled) {
        reason = "Lead delivery is disabled";
        continue;
      }

      if (delivery.daily_cap > 0 && (dailyLeadCountByFirmId.get(row.firm_id) || 0) >= delivery.daily_cap) {
        reason = "Daily cap reached";
        continue;
      }

      if (delivery.monthly_cap > 0 && (monthlyLeadCountByFirmId.get(row.firm_id) || 0) >= delivery.monthly_cap) {
        reason = "Monthly cap reached";
        continue;
      }

      if ((remainingBudgetByFirmId.get(row.firm_id) || 0) < lead.price_cents) {
        reason = "Budget exhausted";
        continue;
      }

      if (
        !matchesBuyingRules(
          {
            states: normalizeRuleList(rules.states),
            case_types: normalizeRuleList(rules.case_types),
            min_price_cents: rules.min_price_cents,
            max_price_cents: rules.max_price_cents,
          },
          lead,
        )
      ) {
        reason = "Buying rules do not match";
        continue;
      }

      chosen = {
        firm_id: row.firm_id,
        rank: row.rank,
        firm_name: firm.name,
      };
      reason = "Eligible";
      break;
    }

    if (!chosen) {
      await recordLeadWaste(supabase, lead, reason);
      return new Response(JSON.stringify({ routed: false, reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        firm_id: chosen.firm_id,
        state: lead.state,
        case_type: lead.case_type,
        claimant_name: lead.claimant_name,
        claimant_phone: lead.claimant_phone,
        claimant_email: lead.claimant_email,
        claimant_contact: lead.claimant_contact,
        price_cents: lead.price_cents,
        source_doc: lead.source_doc,
        delivered_at: new Date().toISOString(),
        current_route_rank: chosen.rank,
        status: "delivered",
      })
      .select("id")
      .single();

    if (insertError || !insertedLead) {
      throw new Error(insertError?.message || "Failed to insert routed lead");
    }

    const deliveryTargets = await loadDeliveryTargets(supabase, chosen.firm_id);

    return new Response(
      JSON.stringify({
        routed: true,
        lead_id: insertedLead.id,
        firm_id: chosen.firm_id,
        firm_name: chosen.firm_name,
        rank: chosen.rank,
        contacts: deliveryTargets,
        email_targets: deliveryTargets.map((target) => target.email),
        phone_targets: deliveryTargets
          .map((target) => target.phone_number)
          .filter((phone): phone is string => Boolean(phone?.trim())),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
