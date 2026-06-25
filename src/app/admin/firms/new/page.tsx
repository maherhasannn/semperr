"use client";

import { useState } from "react";
import {
  Column,
  Heading,
  Text,
  Input,
  Button,
  Row,
  SmartLink,
} from "@once-ui-system/core";

export default function AdminCreateFirmPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [firmName, setFirmName] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [barState, setBarState] = useState("");
  const [statesCovered, setStatesCovered] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminKey}`,
  };

  const handleCreateFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const firmRes = await fetch("/api/admin/firms", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: firmName,
          bar_number: barNumber || null,
          bar_state: barState || null,
          states_covered: statesCovered
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (!firmRes.ok) {
        const data = await firmRes.json();
        setError(data.error || "Failed to create firm");
        setLoading(false);
        return;
      }

      const { firm } = await firmRes.json();

      const userRes = await fetch(`/api/admin/firms/${firm.id}/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: contactEmail,
          name: contactName || null,
          role: "owner",
        }),
      });

      if (!userRes.ok) {
        const data = await userRes.json();
        setError(data.error || "Firm created but failed to add user");
        setLoading(false);
        return;
      }

      setSuccess(
        `Firm "${firm.name}" created. ${contactEmail} can now sign in at /login.`,
      );
      setFirmName("");
      setBarNumber("");
      setBarState("");
      setStatesCovered("");
      setContactEmail("");
      setContactName("");
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <Column
        fillWidth
        horizontal="center"
        vertical="center"
        padding="xl"
        style={{ minHeight: "100vh" }}
      >
        <Column fillWidth maxWidth="xs" gap="xl">
          <Column gap="s">
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
            <Heading variant="display-strong-xs">Admin Access</Heading>
          </Column>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAuthenticated(true);
            }}
          >
            <Column fillWidth gap="16">
              <Input
                id="adminKey"
                type="password"
                label="Admin API key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
              />
              <Button type="submit" size="m" fillWidth disabled={!adminKey}>
                Continue
              </Button>
            </Column>
          </form>
        </Column>
      </Column>
    );
  }

  return (
    <Column
      fillWidth
      horizontal="center"
      vertical="center"
      padding="xl"
      style={{ minHeight: "100vh" }}
    >
      <Column fillWidth maxWidth="s" gap="xl">
        <Column gap="s">
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
          <Heading variant="display-strong-xs">Create a firm</Heading>
          <Text variant="body-default-l" onBackground="neutral-weak">
            Add a new firm and invite their primary contact.
          </Text>
        </Column>

        <form onSubmit={handleCreateFirm}>
          <Column fillWidth gap="16">
            <Text variant="label-strong-s" onBackground="neutral-strong">
              Firm details
            </Text>
            <Input
              id="firmName"
              label="Firm name"
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
                value={barState}
                onChange={(e) => setBarState(e.target.value)}
              />
            </Row>
            <Input
              id="statesCovered"
              label="States covered (comma-separated)"
              placeholder="CA, TX, FL"
              value={statesCovered}
              onChange={(e) => setStatesCovered(e.target.value)}
            />

            <Text
              variant="label-strong-s"
              onBackground="neutral-strong"
              style={{ marginTop: "8px" }}
            >
              Primary contact
            </Text>
            <Input
              id="contactEmail"
              label="Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
            <Input
              id="contactName"
              label="Full name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />

            {error && (
              <Text variant="body-default-s" onBackground="danger-strong">
                {error}
              </Text>
            )}
            {success && (
              <Column
                fillWidth
                padding="l"
                radius="l"
                border="success-alpha-medium"
                background="surface"
              >
                <Text variant="body-default-s" onBackground="success-strong">
                  {success}
                </Text>
              </Column>
            )}

            <Button
              type="submit"
              size="m"
              fillWidth
              disabled={loading || !firmName || !contactEmail}
            >
              {loading ? "Creating..." : "Create firm & invite user"}
            </Button>
          </Column>
        </form>
      </Column>
    </Column>
  );
}
