"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Column,
  Heading,
  Text,
  Input,
  Button,
  Row,
  SmartLink,
} from "@once-ui-system/core";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/onboarding");
    });
  }, [router]);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [firmName, setFirmName] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await getSupabase().auth.signOut();

      const res = await fetch("/api/verify-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        setError("Unable to check account. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data.exists) {
        setError(
          "No account found for this email. Contact your administrator to get started.",
        );
        setLoading(false);
        return;
      }

      setFirmName(data.firmName || "");

      const { error: otpError } = await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        setError(otpError.message);
      } else {
        setStep("otp");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await getSupabase().auth.verifyOtp({
          email: email.trim(),
          token: otp,
          type: "email",
        });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Verification succeeded but no user returned. Try again.");
        setLoading(false);
        return;
      }

      const linkRes = await fetch("/api/auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user.id,
          email: email.trim(),
        }),
      });

      if (!linkRes.ok) {
        setError("Failed to link account. Please try again.");
        setLoading(false);
        return;
      }

      const linkData = await linkRes.json();

      if (linkData.onboardingCompleted) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    } catch {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Row
      fillWidth
      style={{
        minHeight: "100vh",
        position: "fixed",
        inset: 0,
        zIndex: 100,
      }}
    >
      <Column
        fill
        flex={1}
        horizontal="center"
        vertical="center"
        padding="xl"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <Image
          src="/images/og/home.jpg"
          alt=""
          fill
          style={{ objectFit: "cover", opacity: 0.4 }}
          priority
        />
        <Column
          gap="m"
          horizontal="center"
          style={{ position: "relative", zIndex: 1 }}
        >
          <SmartLink href="/" style={{ textDecoration: "none" }}>
            <Text
              variant="heading-default-l"
              onBackground="neutral-strong"
              style={{
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 400,
              }}
            >
              Semperr
            </Text>
          </SmartLink>
          <Text
            variant="body-default-m"
            onBackground="neutral-weak"
            align="center"
            wrap="balance"
            style={{ maxWidth: "320px" }}
          >
            Pre-qualified leads, delivered exclusively to your firm.
          </Text>
        </Column>
      </Column>

      <Column
        background="page"
        flex={1}
        horizontal="center"
        vertical="center"
        padding="xl"
        style={{ maxWidth: "560px" }}
      >
        <Column fillWidth maxWidth="xs" gap="xl">
          <Column gap="s">
            <Heading variant="display-strong-xs">Sign in</Heading>
            <Text variant="body-default-l" onBackground="neutral-weak">
              {step === "email"
                ? "Enter your email to access your firm portal."
                : `We sent a code to ${email}`}
            </Text>
            {step === "otp" && firmName && (
              <Text variant="body-default-s" onBackground="brand-weak">
                Signing in to {firmName}
              </Text>
            )}
          </Column>

          {step === "email" ? (
            <form onSubmit={handleSendOtp} style={{ width: "100%" }}>
              <Column fillWidth gap="16">
                <Input
                  id="email"
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  errorMessage={error}
                />
                <Row height="48" vertical="center">
                  <Button type="submit" size="m" fillWidth disabled={loading}>
                    {loading ? "Checking..." : "Continue"}
                  </Button>
                </Row>
              </Column>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ width: "100%" }}>
              <Column fillWidth gap="16">
                <Input
                  id="otp"
                  type="text"
                  label="Verification code"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  errorMessage={error}
                />
                <Row height="48" vertical="center">
                  <Button type="submit" size="m" fillWidth disabled={loading}>
                    {loading ? "Verifying..." : "Sign in"}
                  </Button>
                </Row>
                <Row horizontal="center">
                  <Button
                    variant="tertiary"
                    size="s"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setError("");
                    }}
                  >
                    Use a different email
                  </Button>
                </Row>
              </Column>
            </form>
          )}
        </Column>
      </Column>
    </Row>
  );
}
