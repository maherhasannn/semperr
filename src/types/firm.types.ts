export type FirmStatus = "pending_verification" | "active" | "suspended";
export type FirmUserRole = "owner" | "admin" | "member";
export type LedgerEntryType = "topup" | "deduction" | "credit" | "auto_recharge";
export type CaseLevel = 1 | 2;
export type FirmTier = 1 | 2 | 3;

export type Firm = {
  id: string;
  name: string;
  states_covered: string[];
  bar_number: string | null;
  bar_state: string | null;
  tier: FirmTier;
  status: FirmStatus;
  stripe_customer_id: string | null;
  created_at: string;
};

export type FirmUser = {
  id: string;
  firm_id: string;
  auth_user_id: string | null;
  email: string;
  name: string | null;
  role: FirmUserRole;
  onboarding_completed: boolean;
  terms_accepted_at: string | null;
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
