import { Column, Heading, Text, Row, Line, Button, Icon } from "@once-ui-system/core";
import { baseURL } from "@/resources";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Semperr",
  description:
    "Flat-rate lead generation, domain ranking, and omni-channel ads for law firms.",
  robots: { index: false, follow: false },
};

function Section({
  children,
  border = true,
}: {
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <Column fillWidth gap="32" paddingY="48">
      {children}
      {border && <Line fillWidth background="neutral-alpha-weak" />}
    </Column>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Column gap="4" horizontal="center" align="center" style={{ flex: 1 }}>
      <Text
        variant="heading-strong-xl"
        onBackground="brand-strong"
        style={{ fontSize: "2.25rem" }}
      >
        {value}
      </Text>
      <Text variant="body-default-s" onBackground="neutral-weak">
        {label}
      </Text>
    </Column>
  );
}

function Pillar({
  number,
  title,
  description,
  items,
}: {
  number: string;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Column
      gap="20"
      padding="32"
      border="neutral-alpha-weak"
      radius="l"
      style={{ flex: 1, minWidth: 280 }}
    >
      <Text
        variant="label-strong-s"
        onBackground="brand-strong"
        style={{ letterSpacing: "0.1em" }}
      >
        {number}
      </Text>
      <Heading variant="heading-strong-l">{title}</Heading>
      <Text variant="body-default-m" onBackground="neutral-weak">
        {description}
      </Text>
      <Column gap="12" paddingTop="8">
        {items.map((item, i) => (
          <Row key={i} gap="12" vertical="start">
            <Text
              variant="body-default-m"
              onBackground="brand-strong"
              style={{ flexShrink: 0 }}
            >
              +
            </Text>
            <Text variant="body-default-m">{item}</Text>
          </Row>
        ))}
      </Column>
    </Column>
  );
}

function Objection({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <Column gap="8">
      <Text variant="heading-strong-m">{question}</Text>
      <Text variant="body-default-m" onBackground="neutral-weak">
        {answer}
      </Text>
    </Column>
  );
}

export default function Pricing() {
  return (
    <Column
      fillWidth
      maxWidth="m"
      paddingX="l"
      paddingY="64"
      gap="0"
      horizontal="center"
      data-theme="light"
      data-neutral="gray"
      data-brand="cyan"
      data-accent="cyan"
      style={{ background: "#ffffff", color: "#111", borderRadius: "1rem" }}
    >
      {/* Hero */}
      <Section border={false}>
        <Column gap="24" horizontal="center" align="center" maxWidth="s">
          <Text
            variant="label-strong-s"
            style={{
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.5,
            }}
          >
            Prepared for your firm
          </Text>
          <Heading
            variant="display-strong-l"
            align="center"
            style={{ lineHeight: 1.1 }}
          >
            More cases. Better clients. One partner.
          </Heading>
          <Text
            variant="body-default-l"
            onBackground="neutral-weak"
            align="center"
            style={{ maxWidth: "36rem" }}
          >
            Semperr combines domain ranking, omni-channel advertising, and
            exclusive lead delivery to grow your firm — without competing
            against your own vendor.
          </Text>
        </Column>
      </Section>

      <Line fillWidth background="neutral-alpha-weak" />

      {/* What you get */}
      <Section>
        <Column gap="16">
          <Text
            variant="label-strong-s"
            style={{
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: 0.5,
            }}
          >
            The system
          </Text>
          <Heading variant="heading-strong-xl">
            Three pillars. One flat rate.
          </Heading>
          <Text
            variant="body-default-l"
            onBackground="neutral-weak"
            style={{ maxWidth: "40rem" }}
          >
            Most agencies sell you one channel and call it a strategy. We run
            all three so they compound — rankings feed credibility, ads capture
            demand, and leads land pre-qualified.
          </Text>
        </Column>

        <Row
          fillWidth
          gap="20"
          style={{ flexWrap: "wrap" }}
        >
          <Pillar
            number="01"
            title="Domain ranking"
            description="We build your organic presence so your firm shows up when clients search. This is a long-term play — results compound over months, not days — but it's the highest-ROI channel in legal."
            items={[
              "Technical SEO audit and ongoing optimization",
              "Content strategy targeting high-intent legal searches",
              "Local SEO and Google Business Profile management",
              "Monthly reporting with transparent keyword tracking",
            ]}
          />
          <Pillar
            number="02"
            title="Omni-channel ads"
            description="We run Google Ads, Meta (Facebook & Instagram), and Google Local Service Ads in parallel — tested and optimized weekly to drive cost-per-lead down."
            items={[
              "Google Search & LSA campaigns for high-intent capture",
              "Meta campaigns for awareness and retargeting",
              "Landing page optimization for conversion",
              "Ad spend managed and optimized by our team (billed separately)",
            ]}
          />
          <Pillar
            number="03"
            title="Exclusive lead delivery"
            description="Every lead we generate is yours alone. We don't resell, we don't share, and we don't work with your direct competitors in your metro."
            items={[
              "Leads delivered to your intake team in real time",
              "CRM, email, phone, or custom API integration",
              "Lead quality scoring and source transparency",
              "Weekly performance reviews with your account manager",
            ]}
          />
        </Row>
      </Section>

      {/* Geo-lock */}
      <Section>
        <Row fillWidth gap="32" style={{ flexWrap: "wrap" }} vertical="center">
          <Column gap="16" style={{ flex: 1, minWidth: 280 }}>
            <Text
              variant="label-strong-s"
              style={{
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                opacity: 0.5,
              }}
            >
              Market exclusivity
            </Text>
            <Heading variant="heading-strong-xl">
              Your metro. Your practice area. Locked.
            </Heading>
            <Text
              variant="body-default-l"
              onBackground="neutral-weak"
              style={{ maxWidth: "32rem" }}
            >
              Once we partner, we will not work with another firm in the same
              practice area within your metro. Your growth doesn't come at the
              expense of a client sitting across the table from your vendor's
              other client.
            </Text>
          </Column>
          <Column
            gap="16"
            padding="32"
            border="neutral-alpha-weak"
            radius="l"
            style={{ flex: 1, minWidth: 280 }}
          >
            <Row gap="12" vertical="center">
              <Text variant="body-default-m" onBackground="brand-strong">+</Text>
              <Text variant="body-default-m">
                One firm per practice area per metro — no exceptions
              </Text>
            </Row>
            <Row gap="12" vertical="center">
              <Text variant="body-default-m" onBackground="brand-strong">+</Text>
              <Text variant="body-default-m">
                Exclusivity starts the day your engagement begins
              </Text>
            </Row>
            <Row gap="12" vertical="center">
              <Text variant="body-default-m" onBackground="brand-strong">+</Text>
              <Text variant="body-default-m">
                We turn away competitors who inquire after you've locked in
              </Text>
            </Row>
          </Column>
        </Row>
      </Section>

      {/* Pricing */}
      <Section>
        <Column gap="16" horizontal="center" align="center">
          <Text
            variant="label-strong-s"
            style={{
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: 0.5,
            }}
          >
            Pricing
          </Text>
          <Heading variant="heading-strong-xl">
            $3,000/mo. Flat. No surprises.
          </Heading>
          <Text
            variant="body-default-l"
            onBackground="neutral-weak"
            align="center"
            style={{ maxWidth: "36rem" }}
          >
            One retainer covers domain ranking, omni-channel ad management,
            lead delivery, and your dedicated account manager. Ad spend is
            billed separately and varies by practice area.
          </Text>
        </Column>

        <Row fillWidth gap="20" horizontal="center" style={{ flexWrap: "wrap" }}>
          <Stat value="$3k" label="Monthly retainer" />
          <Stat value="Flat" label="No hidden fees" />
          <Stat value="M-to-M" label="Month-to-month" />
        </Row>

        <Column
          fillWidth
          gap="16"
          padding="32"
          border="neutral-alpha-weak"
          radius="l"
        >
          <Text variant="heading-strong-m">What's included</Text>
          <Row fillWidth gap="32" style={{ flexWrap: "wrap" }}>
            <Column gap="12" style={{ flex: 1, minWidth: 240 }}>
              <Row gap="12" vertical="center">
                <Text onBackground="brand-strong">+</Text>
                <Text variant="body-default-m">Full SEO program (technical + content + local)</Text>
              </Row>
              <Row gap="12" vertical="center">
                <Text onBackground="brand-strong">+</Text>
                <Text variant="body-default-m">Google Ads, Meta Ads, and LSA management</Text>
              </Row>
              <Row gap="12" vertical="center">
                <Text onBackground="brand-strong">+</Text>
                <Text variant="body-default-m">Landing page design and conversion optimization</Text>
              </Row>
            </Column>
            <Column gap="12" style={{ flex: 1, minWidth: 240 }}>
              <Row gap="12" vertical="center">
                <Text onBackground="brand-strong">+</Text>
                <Text variant="body-default-m">Exclusive leads delivered to your intake team</Text>
              </Row>
              <Row gap="12" vertical="center">
                <Text onBackground="brand-strong">+</Text>
                <Text variant="body-default-m">Dedicated account manager and weekly reviews</Text>
              </Row>
              <Row gap="12" vertical="center">
                <Text onBackground="brand-strong">+</Text>
                <Text variant="body-default-m">Metro-level market exclusivity</Text>
              </Row>
            </Column>
          </Row>
        </Column>
      </Section>

      {/* Objections */}
      <Section>
        <Column gap="16">
          <Text
            variant="label-strong-s"
            style={{
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: 0.5,
            }}
          >
            Straight answers
          </Text>
          <Heading variant="heading-strong-xl">
            You've heard this before. Here's why this is different.
          </Heading>
        </Column>

        <Column gap="32">
          <Objection
            question={`"$3,000 a month is a lot for marketing."`}
            answer="One signed personal injury case can be worth $50,000 to $500,000 in fees. If we deliver two qualified cases in a month, your ROI is 15-30x. The question isn't whether $3k is a lot — it's whether leaving qualified leads on the table is costing you more. Most firms that engage us see their cost-per-acquisition drop within 90 days because we're running three channels in parallel, not one."
          />
          <Line fillWidth background="neutral-alpha-weak" />
          <Objection
            question={`"We worked with an agency before and got burned."`}
            answer="We hear this constantly. Most agencies lock you into a 6-12 month contract, send you a dashboard you never check, and vanish. We do month-to-month with no termination fee. You get a named account manager, weekly performance reviews, and full transparency on where every lead comes from and what it costs. If a month doesn't deliver, you walk."
          />
          <Line fillWidth background="neutral-alpha-weak" />
          <Objection
            question={`"We already have someone doing SEO / running our ads."`}
            answer="That's fine — we audit what they're doing before we start. In most cases, firms are paying for one channel in isolation with no coordination. An SEO vendor who doesn't talk to your ads team is leaving money on the table. We run all three channels as a single system, which means your Google Ads inform your SEO priorities, your SEO content feeds your Meta retargeting, and your leads come from everywhere at once."
          />
          <Line fillWidth background="neutral-alpha-weak" />
          <Objection
            question={`"How long until we see results?"`}
            answer="Ads deliver leads within the first 2-4 weeks. SEO is a longer play — expect meaningful organic movement in 3-6 months, with compounding returns after that. That's exactly why we run both in parallel: ads cover you now, organic covers you permanently. And because it's month-to-month, you're never stuck if the numbers don't work."
          />
        </Column>
      </Section>

      {/* How we work */}
      <Section border={false}>
        <Column gap="16" horizontal="center" align="center">
          <Text
            variant="label-strong-s"
            style={{
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: 0.5,
            }}
          >
            How we work together
          </Text>
          <Heading variant="heading-strong-xl" align="center">
            We only win when you win.
          </Heading>
        </Column>

        <Row fillWidth gap="20" style={{ flexWrap: "wrap" }}>
          <Column
            gap="12"
            padding="32"
            border="neutral-alpha-weak"
            radius="l"
            style={{ flex: 1, minWidth: 240 }}
          >
            <Text variant="heading-strong-m">Month-to-month</Text>
            <Text variant="body-default-m" onBackground="neutral-weak">
              No long-term contracts. Give us two weeks notice if a month
              doesn't deliver, and we wind down cleanly. No termination fee.
            </Text>
          </Column>
          <Column
            gap="12"
            padding="32"
            border="neutral-alpha-weak"
            radius="l"
            style={{ flex: 1, minWidth: 240 }}
          >
            <Text variant="heading-strong-m">Full transparency</Text>
            <Text variant="body-default-m" onBackground="neutral-weak">
              You always know where your leads come from, what they cost, and
              how they convert. Weekly reviews with your account manager. No
              black boxes.
            </Text>
          </Column>
          <Column
            gap="12"
            padding="32"
            border="neutral-alpha-weak"
            radius="l"
            style={{ flex: 1, minWidth: 240 }}
          >
            <Text variant="heading-strong-m">Live in 2 weeks</Text>
            <Text variant="body-default-m" onBackground="neutral-weak">
              We onboard, audit your current setup, launch ads, and begin SEO
              within 14 days. Your first leads typically arrive within the
              first month.
            </Text>
          </Column>
        </Row>
      </Section>

      <Line fillWidth background="neutral-alpha-weak" />

      {/* CTA */}
      <Column
        fillWidth
        gap="24"
        paddingY="64"
        horizontal="center"
        align="center"
      >
        <Heading variant="heading-strong-xl" align="center">
          Ready to lock in your metro?
        </Heading>
        <Text
          variant="body-default-l"
          onBackground="neutral-weak"
          align="center"
          style={{ maxWidth: "32rem" }}
        >
          Spots are limited by market. Once your practice area is taken in
          your metro, we turn away competitors. Let's talk before someone
          else does.
        </Text>
        <Row gap="16" style={{ flexWrap: "wrap" }} horizontal="center">
          <Button
            href="https://cal.com/maherhasan"
            variant="primary"
            size="l"
          >
            Book a call
          </Button>
          <Button
            href="mailto:join@semperr.com"
            variant="secondary"
            size="l"
          >
            Email us
          </Button>
          <Button
            href="sms:+17609166605"
            variant="tertiary"
            size="l"
          >
            Text us
          </Button>
        </Row>
        <Text variant="body-default-s" onBackground="neutral-weak">
          join@semperr.com &middot; (760) 916-6605
        </Text>
      </Column>
    </Column>
  );
}
