export type FirmStatus = "pending_verification" | "paused" | "active" | "suspended";
export type FirmPaymentStatus = "missing" | "valid" | "invalid" | "card_failed";
export type FirmUserRole = "owner" | "admin" | "member";
export type NotificationChannel = "email" | "sms";
export type LedgerEntryType = "topup" | "deduction" | "credit" | "auto_recharge";
export type CaseLevel = 1 | 2;
export type FirmTier = 1 | 2 | 3;

export type Firm = {
  id: string;
  name: string;
  states_covered: string[];
  bar_number: string | null;
  bar_state: string | null;
  website_url: string | null;
  primary_contact_phone: string | null;
  primary_contact_title: string | null;
  practice_areas: string[];
  support_notes: string | null;
  tier: FirmTier;
  status: FirmStatus;
  payment_status: FirmPaymentStatus;
  has_valid_payment_method: boolean;
  stripe_customer_id: string | null;
  created_at: string;
};

export type FirmUser = {
  id: string;
  firm_id: string;
  user_id: string | null;
  email: string;
  phone_number: string | null;
  name: string | null;
  role: FirmUserRole;
  onboarding_completed: boolean;
  terms_accepted_at: string | null;
  created_at: string;
};

export type FirmDeliverySettings = {
  id: string;
  firm_id: string;
  lead_delivery_enabled: boolean;
  daily_cap: number;
  monthly_cap: number;
  created_at: string;
};

export type FirmNotificationTarget = {
  id: string;
  firm_id: string;
  channel: NotificationChannel;
  value: string;
  label: string | null;
  is_primary: boolean;
  active: boolean;
  created_at: string;
};

export type FirmBuyingRules = {
  id: string;
  firm_id: string;
  states: string[];
  case_types: string[];
  min_price_cents: number;
  max_price_cents: number;
  created_at: string;
};

export type StateExclusivity = {
  id: string;
  state: string;
  firm_id: string;
  rank: number;
  status: "approved" | "paused" | "revoked";
  created_at: string;
};

export type CaseStatus = "delivered" | "accepted" | "declined" | "credited";

export type Case = {
  id: string;
  firm_id: string;
  state: string;
  case_type: string;
  claimant_name: string | null;
  claimant_contact: string | null;
  claimant_phone: string | null;
  claimant_email: string | null;
  injury_date: string | null;
  days_missed: number | null;
  employment_status: string | null;
  no_current_attorney: boolean | null;
  within_sol: boolean | null;
  intake_notes: string | null;
  level: CaseLevel;
  price_cents: number;
  recording_url: string | null;
  trustedform_cert_url: string | null;
  source_doc: string | null;
  consent_timestamp: string | null;
  delivered_at: string | null;
  current_route_rank: number | null;
  status: CaseStatus;
  created_at: string;
};

export type LedgerEntry = {
  id: string;
  firm_id: string;
  type: LedgerEntryType;
  amount_cents: number;
  case_id: string | null;
  stripe_ref: string | null;
  note: string | null;
  created_at: string;
};

export type Lead = Case;

export type Transaction = LedgerEntry;

export type FirmSupportRequestType =
  | "firm_profile_update"
  | "payment_change"
  | "state_rank_change"
  | "buying_rules_change";

export type FirmSupportRequest = {
  id: string;
  firm_id: string;
  requested_by_user_id: string;
  request_type: FirmSupportRequestType;
  details: Record<string, unknown>;
  status: "open" | "approved" | "rejected";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
};
