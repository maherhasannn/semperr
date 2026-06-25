"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Column,
  Heading,
  Text,
  Input,
  Button,
  Row,
  SmartLink,
  Spinner,
} from "@once-ui-system/core";
import { getSupabase } from "@/lib/supabase";
import type { Firm, FirmUser } from "@/types/firm.types";

type Step = "welcome" | "terms" | "payment" | "complete";

const MINIMUM_PREPAY_DISPLAY = "$500.00";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <Column
          fill
          horizontal="center"
          vertical="center"
          style={{ minHeight: "100vh" }}
        >
          <Spinner />
        </Column>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [firm, setFirm] = useState<Firm | null>(null);
  const [firmUser, setFirmUser] = useState<FirmUser | null>(null);
  const [userName, setUserName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [barState, setBarState] = useState("");
  const [statesCovered, setStatesCovered] = useState("");
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const verifyPayment = useCallback(async (sessionId: string) => {
    setPaymentVerifying(true);
    setError("");
    try {
      const res = await fetch(
        `/api/onboarding/verify-payment?session_id=${sessionId}`,
      );
      if (!res.ok) {
        setError("Payment verification failed. Please contact support.");
        setPaymentVerifying(false);
        return;
      }
      const data = await res.json();
      if (data.completed) {
        setPaymentComplete(true);
        setPaymentVerifying(false);
      } else {
        setTimeout(() => verifyPayment(sessionId), 3000);
      }
    } catch {
      setError("Failed to verify payment. Please contact support.");
      setPaymentVerifying(false);
    }
  }, []);

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

      const res = await fetch("/api/onboarding");

      if (res.status === 401 || res.status === 404) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        setError("Failed to load account data. Please refresh the page.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.firmUser?.onboarding_completed) {
        router.replace("/dashboard");
        return;
      }

      setFirm(data.firm);
      setFirmUser(data.firmUser);
      setUserName(data.firmUser?.name || "");

      const newAccount = data.firm?.name === "Pending Setup";
      setIsNewAccount(newAccount);
      setFirmName(newAccount ? "" : data.firm?.name || "");
      setBarNumber(data.firm?.bar_number || "");
      setBarState(data.firm?.bar_state || "");
      setStatesCovered(data.firm?.states_covered?.join(", ") || "");

      const urlStep = searchParams.get("step");
      const sessionId = searchParams.get("session_id");
      const cancelled = searchParams.get("cancelled");

      if (urlStep === "complete" && sessionId) {
        setStep("complete");
        setLoading(false);
        verifyPayment(sessionId);
        return;
      }

      if (urlStep === "payment" && cancelled) {
        setStep("payment");
        setError("Payment was cancelled. You can try again when ready.");
      } else if (data.firmUser?.terms_accepted_at) {
        setStep("payment");
      }

      setLoading(false);
    };

    init();
  }, [router, searchParams, verifyPayment]);

  const handleAcceptTerms = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          firmName: firmName || undefined,
          barNumber: barNumber || undefined,
          barState: barState || undefined,
          statesCovered: statesCovered
            ? statesCovered
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        }),
      });
      if (res.ok) {
        setStep("payment");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to save. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  const handleStartPayment = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/create-checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
        return;
      }
      setError(data.error || "Failed to create payment session.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
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

  const stepIndex = { welcome: 1, terms: 2, payment: 3, complete: 3 };
  const currentStep = stepIndex[step];

  return (
    <Column
      fillWidth
      horizontal="center"
      vertical="center"
      padding="xl"
      style={{ minHeight: "100vh" }}
    >
      <Column fillWidth maxWidth="s" gap="xl">
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

        {step !== "complete" && (
          <Column gap="s">
            <Text variant="body-default-s" onBackground="neutral-weak">
              Step {currentStep} of 3
            </Text>
            <Row fillWidth gap="4">
              {[1, 2, 3].map((s) => (
                <Row
                  key={s}
                  flex={1}
                  style={{
                    height: "4px",
                    borderRadius: "2px",
                    background:
                      s <= currentStep
                        ? "var(--brand-solid-strong)"
                        : "var(--neutral-alpha-weak)",
                  }}
                />
              ))}
            </Row>
          </Column>
        )}

        {step === "welcome" && (
          <Column gap="xl">
            <Column gap="s">
              <Heading variant="display-strong-xs">Welcome to Semperr</Heading>
              <Text variant="body-default-l" onBackground="neutral-weak">
                Confirm your details to get started with your firm portal.
              </Text>
            </Column>

            {firm && !isNewAccount && (
              <Column
                fillWidth
                padding="l"
                radius="l"
                border="neutral-alpha-weak"
                background="surface"
                gap="12"
              >
                <Row fillWidth horizontal="between">
                  <Text
                    variant="label-default-s"
                    onBackground="neutral-weak"
                  >
                    Firm
                  </Text>
                  <Text variant="body-default-m">{firm.name}</Text>
                </Row>
                {firm.bar_number && (
                  <Row fillWidth horizontal="between">
                    <Text
                      variant="label-default-s"
                      onBackground="neutral-weak"
                    >
                      Bar number
                    </Text>
                    <Text variant="body-default-m">
                      {firm.bar_number}
                      {firm.bar_state ? ` (${firm.bar_state})` : ""}
                    </Text>
                  </Row>
                )}
                {firm.states_covered?.length > 0 && (
                  <Row fillWidth horizontal="between">
                    <Text
                      variant="label-default-s"
                      onBackground="neutral-weak"
                    >
                      States covered
                    </Text>
                    <Text variant="body-default-m">
                      {firm.states_covered.join(", ")}
                    </Text>
                  </Row>
                )}
              </Column>
            )}

            <Column gap="16">
              <Input
                id="userName"
                label="Your full name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
              {isNewAccount && (
                <>
                  <Input
                    id="firmName"
                    label="Firm / Company name"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    required
                  />
                  <Row fillWidth gap="8">
                    <Input
                      id="barNumber"
                      label="Bar number"
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                    />
                    <Input
                      id="barState"
                      label="Bar state"
                      placeholder="e.g. CA"
                      value={barState}
                      onChange={(e) => setBarState(e.target.value)}
                    />
                  </Row>
                  <Input
                    id="statesCovered"
                    label="States you cover (comma-separated)"
                    placeholder="CA, TX, FL"
                    value={statesCovered}
                    onChange={(e) => setStatesCovered(e.target.value)}
                  />
                </>
              )}
            </Column>

            <Button
              size="m"
              fillWidth
              disabled={!userName.trim() || (isNewAccount && !firmName.trim())}
              onClick={() => setStep("terms")}
            >
              Continue
            </Button>
          </Column>
        )}

        {step === "terms" && (
          <Column gap="xl">
            <Column gap="s">
              <Heading variant="display-strong-xs">
                Rules of engagement
              </Heading>
              <Text variant="body-default-l" onBackground="neutral-weak">
                Please review the following before proceeding.
              </Text>
            </Column>

            <Column
              fillWidth
              padding="l"
              radius="l"
              border="neutral-alpha-weak"
              background="surface"
              gap="l"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              <Column gap="8">
                <Text variant="label-strong-s">
                  What counts as a billable case
                </Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  A case is billable when it meets all qualification criteria:
                  the claimant has a workplace injury, an injury date is present,
                  they have missed work days, they have no current attorney, the
                  claim is within the statute of limitations, and the claimant
                  has consented to attorney contact. Cases are delivered at two
                  levels: Level 1 (intake completed) and Level 2 (intake
                  completed + signed retainer), with pricing reflecting the
                  level.
                </Text>
              </Column>

              <Column gap="8">
                <Text variant="label-strong-s">Credit and refund policy</Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  If a delivered case does not meet the stated qualification
                  criteria, you may request a credit directly from your case
                  record. Credit requests are reviewed within 2 business days.
                  Approved credits restore the case cost to your balance. Denied
                  requests include a written explanation. We make it easy to
                  dispute on purpose — with real intake, genuine disputes are
                  rare.
                </Text>
              </Column>

              <Column gap="8">
                <Text variant="label-strong-s">Exclusivity</Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  Every case delivered to your firm is exclusive to you. It is
                  not shared with, sold to, or visible to any other firm. You are
                  the sole recipient.
                </Text>
              </Column>

              <Column gap="8">
                <Text variant="label-strong-s">Billing model</Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  This is a prepaid balance, not a subscription. You fund your
                  account and pay per case delivered. Your balance is drawn down
                  with each delivery. You can view every transaction in your
                  ledger at any time. No hidden fees, no recurring charges.
                </Text>
              </Column>
            </Column>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{
                  width: "20px",
                  height: "20px",
                  marginTop: "2px",
                  accentColor: "var(--brand-solid-strong)",
                  cursor: "pointer",
                }}
              />
              <Text variant="body-default-s" onBackground="neutral-strong">
                I have read and agree to the billing terms, credit policy, and
                exclusivity terms described above.
              </Text>
            </label>

            {error && (
              <Text variant="body-default-s" onBackground="danger-strong">
                {error}
              </Text>
            )}

            <Row gap="8">
              <Button
                variant="tertiary"
                size="m"
                fillWidth
                onClick={() => {
                  setError("");
                  setStep("welcome");
                }}
              >
                Back
              </Button>
              <Button
                size="m"
                fillWidth
                disabled={!termsAccepted || saving}
                onClick={handleAcceptTerms}
              >
                {saving ? "Saving..." : "I agree — continue"}
              </Button>
            </Row>
          </Column>
        )}

        {step === "payment" && (
          <Column gap="xl">
            <Column gap="s">
              <Heading variant="display-strong-xs">Fund your account</Heading>
              <Text variant="body-default-l" onBackground="neutral-weak">
                Add a payment method and make your initial deposit to start
                receiving cases.
              </Text>
            </Column>

            <Column
              fillWidth
              padding="l"
              radius="l"
              border="neutral-alpha-weak"
              background="surface"
              gap="16"
            >
              <Row fillWidth horizontal="between" vertical="center">
                <Text variant="label-default-s" onBackground="neutral-weak">
                  Initial deposit
                </Text>
                <Text variant="heading-strong-m">{MINIMUM_PREPAY_DISPLAY}</Text>
              </Row>
              <Text variant="body-default-s" onBackground="neutral-weak">
                This funds your case balance. You only pay per case delivered —
                this is not a subscription. Your card will be saved for future
                top-ups.
              </Text>
            </Column>

            {error && (
              <Text variant="body-default-s" onBackground="danger-strong">
                {error}
              </Text>
            )}

            <Row gap="8">
              <Button
                variant="tertiary"
                size="m"
                fillWidth
                onClick={() => {
                  setError("");
                  setStep("terms");
                }}
              >
                Back
              </Button>
              <Button
                size="m"
                fillWidth
                disabled={saving}
                onClick={handleStartPayment}
              >
                {saving ? "Redirecting..." : "Set up payment"}
              </Button>
            </Row>

            <Row horizontal="center">
              <Button
                variant="tertiary"
                size="s"
                onClick={async () => {
                  setSaving(true);
                  const res = await fetch("/api/onboarding/skip-payment", {
                    method: "POST",
                  });
                  if (res.ok) {
                    router.replace("/dashboard");
                  } else {
                    setError("Failed to skip. Please try again.");
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                Set up later
              </Button>
            </Row>
          </Column>
        )}

        {step === "complete" && (
          <Column gap="xl" horizontal="center">
            {paymentVerifying && !paymentComplete ? (
              <Column gap="m" horizontal="center">
                <Spinner />
                <Text
                  variant="body-default-l"
                  onBackground="neutral-weak"
                  align="center"
                >
                  Verifying your payment...
                </Text>
              </Column>
            ) : paymentComplete ? (
              <>
                <Column gap="s" horizontal="center">
                  <Heading variant="display-strong-xs" align="center">
                    You're all set
                  </Heading>
                  <Text
                    variant="body-default-l"
                    onBackground="neutral-weak"
                    align="center"
                  >
                    Your account is funded and ready. We'll start delivering
                    qualified cases to your portal.
                  </Text>
                </Column>

                <Button
                  size="m"
                  fillWidth
                  onClick={() => router.replace("/dashboard")}
                >
                  Go to your dashboard
                </Button>
              </>
            ) : (
              <Column gap="m" horizontal="center">
                <Text
                  variant="body-default-l"
                  onBackground="danger-strong"
                  align="center"
                >
                  {error || "Something went wrong verifying your payment."}
                </Text>
                <Button
                  variant="secondary"
                  size="m"
                  onClick={() => {
                    setError("");
                    setStep("payment");
                  }}
                >
                  Try again
                </Button>
              </Column>
            )}
          </Column>
        )}
      </Column>
    </Column>
  );
}
