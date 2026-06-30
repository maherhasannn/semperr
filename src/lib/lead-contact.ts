type LeadContactInput = {
  claimant_contact?: string | null;
  claimant_phone?: string | null;
  claimant_email?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type NormalizedLeadContact = {
  claimant_contact: string | null;
  claimant_phone: string | null;
  claimant_email: string | null;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function combineLeadContact(
  phone: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const parts = [clean(phone), clean(email)].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : null;
}

export function normalizeLeadContact(input: LeadContactInput): NormalizedLeadContact {
  const contact = clean(input.claimant_contact);
  let phone = clean(input.claimant_phone) || clean(input.phone);
  let email = clean(input.claimant_email) || clean(input.email);

  if (contact && contact.includes("@") && !email) {
    email = contact;
  } else if (contact && !phone) {
    phone = contact;
  }

  return {
    claimant_contact: contact || combineLeadContact(phone, email),
    claimant_phone: phone,
    claimant_email: email,
  };
}
