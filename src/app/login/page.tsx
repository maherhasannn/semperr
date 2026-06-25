"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Column,
  Flex,
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
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await getSupabase().auth.signInWithOtp({ email });

    if (error) {
      setError(error.message);
    } else {
      setStep("otp");
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await getSupabase().auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }

    setLoading(false);
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
      {/* Left panel — art/branding */}
      <Column
        fill
        flex={1}
        horizontal="center"
        vertical="center"
        padding="xl"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
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
            Data brokerage for law firms. Pre-qualified leads, delivered.
          </Text>
        </Column>
      </Column>

      {/* Right panel — login form */}
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
                ? "Enter your email to receive a sign-in code."
                : `We sent a code to ${email}`}
            </Text>
          </Column>

          {step === "email" ? (
            <form onSubmit={handleSendOtp} style={{ width: "100%" }}>
              <Column fillWidth gap="16">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  errorMessage={error}
                />
                <Row height="48" vertical="center">
                  <Button type="submit" size="m" fillWidth disabled={loading}>
                    {loading ? "Sending..." : "Continue"}
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
