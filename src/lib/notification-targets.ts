import type { NotificationChannel } from "@/types/firm.types";

export type NotificationTargetValidation = {
  normalizedValue: string;
  error: string | null;
};

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeEmail(value: string) {
  return clean(value).toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: string) {
  const trimmed = clean(value);
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const extensionIndex = lower.search(/(?:ext\.?|x)\s*\d+$/);
  const withoutExtension = extensionIndex >= 0 ? trimmed.slice(0, extensionIndex) : trimmed;
  const stripped = withoutExtension.replace(/[()\s.-]/g, "");

  if (stripped.startsWith("+")) {
    const digits = stripped.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  }

  const digits = stripped.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return "";
}

function isValidNormalizedPhone(value: string) {
  return /^\+\d{8,15}$/.test(value);
}

export function normalizeNotificationTarget(
  channel: NotificationChannel,
  value: string,
): NotificationTargetValidation {
  if (channel === "email") {
    const normalizedValue = normalizeEmail(value);
    if (!normalizedValue) {
      return { normalizedValue: "", error: "Enter an email address." };
    }
    if (!isValidEmail(normalizedValue)) {
      return { normalizedValue, error: "Enter a valid email address." };
    }
    return { normalizedValue, error: null };
  }

  const normalizedValue = normalizePhone(value);
  if (!normalizedValue) {
    return { normalizedValue: "", error: "Enter a phone number." };
  }
  if (!isValidNormalizedPhone(normalizedValue)) {
    return {
      normalizedValue,
      error: "Enter a valid phone number with 8 to 15 digits.",
    };
  }
  return { normalizedValue, error: null };
}

export function formatNotificationTargetPreview(channel: NotificationChannel, value: string) {
  const { normalizedValue, error } = normalizeNotificationTarget(channel, value);
  return { normalizedValue, error };
}
