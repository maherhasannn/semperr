"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Column, Row, Heading, Text, Line } from "@once-ui-system/core";
import styles from "./ROICalculator.module.scss";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderInput({ label, value, min, max, step, format, onChange }: SliderInputProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <Column fillWidth gap="12">
      <Row fillWidth horizontal="between" vertical="center">
        <Text variant="body-default-m" onBackground="neutral-weak">
          {label}
        </Text>
        <Text variant="heading-strong-m" onBackground="neutral-strong">
          {format(value)}
        </Text>
      </Row>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
        style={{
          background: `linear-gradient(to right, var(--brand-background-strong) 0%, var(--brand-background-strong) ${percent}%, var(--neutral-alpha-weak) ${percent}%, var(--neutral-alpha-weak) 100%)`,
        }}
      />
      <Row fillWidth horizontal="between">
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {format(min)}
        </Text>
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {format(max)}
        </Text>
      </Row>
    </Column>
  );
}

export function ROICalculator() {
  const [attorneys, setAttorneys] = useState(10);
  const [avgCaseValue, setAvgCaseValue] = useState(25000);
  const [currentLeads, setCurrentLeads] = useState(50);
  const [conversionRate, setConversionRate] = useState(8);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleChange = (setter: (v: number) => void) => (v: number) => {
    if (!hasInteracted) setHasInteracted(true);
    setter(v);
  };

  // Realistic assumptions:
  // - Semperr improves conversion by 30-50% (not 2.5x)
  // - Lead volume increase of 20-40% through better targeting (not 1.8x)
  // - Results scale slightly with firm size
  const firmSizeMultiplier = 1 + Math.min(attorneys / 200, 0.15);
  const conversionLift = 1.35 * firmSizeMultiplier;
  const leadLift = 1.25 * firmSizeMultiplier;

  const semperrConversionRate = Math.min(conversionRate * conversionLift, 35);
  const currentMonthlyCases = (currentLeads * conversionRate) / 100;
  const semperrLeads = Math.round(currentLeads * leadLift);
  const semperrMonthlyCases = (semperrLeads * semperrConversionRate) / 100;
  const additionalMonthlyCases = semperrMonthlyCases - currentMonthlyCases;
  const additionalAnnualRevenue = additionalMonthlyCases * avgCaseValue * 12;
  const currentAnnualRevenue = currentMonthlyCases * avgCaseValue * 12;
  const totalAnnualRevenue = semperrMonthlyCases * avgCaseValue * 12;

  const blurStyle = !hasInteracted
    ? { filter: "blur(12px)", userSelect: "none" as const, transition: "filter 0.4s ease" }
    : { filter: "blur(0px)", transition: "filter 0.4s ease" };

  return (
    <Column fillWidth gap="48">
      <Row fillWidth gap="xl" s={{ direction: "column", gap: "xl" }}>
        {/* Inputs */}
        <Column flex={1} gap="32">
          <Column gap="8">
            <Text
              variant="label-default-s"
              onBackground="neutral-weak"
              style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
            >
              Your Firm
            </Text>
            <Heading as="h3" variant="heading-strong-l">
              Enter your details
            </Heading>
          </Column>

          <Column
            fillWidth
            gap="32"
            padding="32"
            border="neutral-alpha-weak"
            radius="l"
            background="neutral-alpha-weak"
          >
            <SliderInput
              label="Number of attorneys"
              value={attorneys}
              min={1}
              max={100}
              step={1}
              format={(v) => v.toString()}
              onChange={handleChange(setAttorneys)}
            />
            <Line fillWidth background="neutral-alpha-weak" />
            <SliderInput
              label="Average case value"
              value={avgCaseValue}
              min={5000}
              max={250000}
              step={2500}
              format={formatCurrency}
              onChange={handleChange(setAvgCaseValue)}
            />
            <Line fillWidth background="neutral-alpha-weak" />
            <SliderInput
              label="Monthly inbound leads"
              value={currentLeads}
              min={10}
              max={300}
              step={5}
              format={formatNumber}
              onChange={handleChange(setCurrentLeads)}
            />
            <Line fillWidth background="neutral-alpha-weak" />
            <SliderInput
              label="Current conversion rate"
              value={conversionRate}
              min={1}
              max={20}
              step={1}
              format={(v) => `${v}%`}
              onChange={handleChange(setConversionRate)}
            />
          </Column>
        </Column>

        {/* Results */}
        <Column flex={1} gap="32">
          <Column gap="8">
            <Text
              variant="label-default-s"
              onBackground="neutral-weak"
              style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
            >
              Projected Impact
            </Text>
            <Heading as="h3" variant="heading-strong-l">
              With Semperr
            </Heading>
          </Column>

          <Column fillWidth gap="24" style={{ position: "relative" }}>
            {!hasInteracted && (
              <Column
                horizontal="center"
                align="center"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <Text
                  variant="heading-strong-m"
                  onBackground="neutral-strong"
                  align="center"
                  style={{ pointerEvents: "none" }}
                >
                  Adjust the sliders to see your projected results
                </Text>
              </Column>
            )}

            {/* Hero stat */}
            <Column
              fillWidth
              padding="40"
              radius="l"
              gap="8"
              horizontal="center"
              align="center"
              overflow="hidden"
              style={{ position: "relative", ...blurStyle }}
            >
              <Image
                src="/images/cta-bg.png"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover", opacity: 0.2 }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))",
                }}
              />
              <Text
                variant="body-default-s"
                onBackground="neutral-weak"
                style={{ position: "relative", zIndex: 1 }}
              >
                Additional annual revenue
              </Text>
              <Text
                variant="display-strong-xl"
                onBackground="brand-strong"
                style={{ position: "relative", zIndex: 1 }}
              >
                {formatCurrency(additionalAnnualRevenue)}
              </Text>
            </Column>

            {/* Detail cards */}
            <Row fillWidth gap="16" s={{ direction: "column" }} style={blurStyle}>
              <Column
                flex={1}
                padding="24"
                border="neutral-alpha-weak"
                radius="l"
                gap="4"
                background="neutral-alpha-weak"
              >
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Current monthly cases
                </Text>
                <Text variant="heading-strong-l" onBackground="neutral-strong">
                  {currentMonthlyCases.toFixed(1)}
                </Text>
              </Column>
              <Column
                flex={1}
                padding="24"
                border="neutral-alpha-weak"
                radius="l"
                gap="4"
                background="neutral-alpha-weak"
              >
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Projected monthly cases
                </Text>
                <Text variant="heading-strong-l" onBackground="brand-strong">
                  {semperrMonthlyCases.toFixed(1)}
                </Text>
              </Column>
            </Row>

            <Row fillWidth gap="16" s={{ direction: "column" }} style={blurStyle}>
              <Column
                flex={1}
                padding="24"
                border="neutral-alpha-weak"
                radius="l"
                gap="4"
                background="neutral-alpha-weak"
              >
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Projected lead volume
                </Text>
                <Text variant="heading-strong-l" onBackground="neutral-strong">
                  {semperrLeads}/mo
                </Text>
              </Column>
              <Column
                flex={1}
                padding="24"
                border="neutral-alpha-weak"
                radius="l"
                gap="4"
                background="neutral-alpha-weak"
              >
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Projected conversion rate
                </Text>
                <Text variant="heading-strong-l" onBackground="brand-strong">
                  {semperrConversionRate.toFixed(0)}%
                </Text>
              </Column>
            </Row>

            <Row fillWidth gap="16" s={{ direction: "column" }} style={blurStyle}>
              <Column
                flex={1}
                padding="24"
                border="neutral-alpha-weak"
                radius="l"
                gap="4"
                background="neutral-alpha-weak"
              >
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Current annual revenue
                </Text>
                <Text variant="heading-strong-l" onBackground="neutral-strong">
                  {formatCurrency(currentAnnualRevenue)}
                </Text>
              </Column>
              <Column
                flex={1}
                padding="24"
                border="neutral-alpha-weak"
                radius="l"
                gap="4"
                background="neutral-alpha-weak"
              >
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Projected annual revenue
                </Text>
                <Text variant="heading-strong-l" onBackground="brand-strong">
                  {formatCurrency(totalAnnualRevenue)}
                </Text>
              </Column>
            </Row>
          </Column>
        </Column>
      </Row>

      {/* Disclaimer */}
      <Text variant="body-default-xs" onBackground="neutral-weak" align="center">
        Results are estimates based on real performance data from Semperr clients.
        Actual results vary by practice area, geography, and firm capacity.
      </Text>
    </Column>
  );
}
