import {
  Button,
  Column,
  Heading,
  Text,
  Meta,
  Schema,
  Row,
  Line,
  RevealFx,
} from "@once-ui-system/core";
import { baseURL, about, person } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: about.title,
    description: about.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(about.title)}`,
    path: about.path,
  });
}

export default function About() {
  return (
    <Column fillWidth>
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={about.title}
        description={about.description}
        path={about.path}
        image={`/api/og/generate?title=${encodeURIComponent(about.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />

      {/* Hero */}
      <Column
        fillWidth
        horizontal="center"
        align="center"
        paddingY="104"
        paddingX="l"
        gap="24"
      >
        <RevealFx translateY="4">
          <Text
            variant="label-default-s"
            onBackground="neutral-weak"
            style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
          >
            About Semperr
          </Text>
        </RevealFx>
        <RevealFx translateY="8" delay={0.1}>
          <Heading
            variant="display-strong-xl"
            wrap="balance"
            align="center"
            style={{ maxWidth: "800px" }}
          >
            We help law firms find the clients they were built to serve
          </Heading>
        </RevealFx>
        <RevealFx translateY="8" delay={0.2}>
          <Text
            variant="body-default-l"
            onBackground="neutral-weak"
            wrap="balance"
            align="center"
            style={{ maxWidth: "560px" }}
          >
            Semperr is a data brokerage purpose-built for the legal industry. We
            connect firms with pre-qualified, high-intent leads — so intake teams
            spend less time chasing and more time signing.
          </Text>
        </RevealFx>
      </Column>

      {/* Stats */}
      <Column fillWidth horizontal="center" paddingX="l">
        <Line fillWidth background="neutral-alpha-weak" maxWidth="m" />
        <Row
          fillWidth
          maxWidth="m"
          horizontal="center"
          gap="xl"
          paddingY="64"
          s={{ direction: "column", gap: "l", horizontal: "center", align: "center" }}
        >
          {[
            { value: "500+", label: "Law Firms Served" },
            { value: "2M+", label: "Leads Delivered" },
            { value: "35+", label: "States Covered" },
            { value: "97%", label: "Client Retention" },
          ].map((stat) => (
            <Column key={stat.label} horizontal="center" align="center" gap="4">
              <Text variant="display-strong-l" onBackground="brand-strong">
                {stat.value}
              </Text>
              <Text variant="body-default-s" onBackground="neutral-weak">
                {stat.label}
              </Text>
            </Column>
          ))}
        </Row>
        <Line fillWidth background="neutral-alpha-weak" maxWidth="m" />
      </Column>

      {/* Mission */}
      <Column
        fillWidth
        horizontal="center"
        paddingY="104"
        paddingX="l"
        overflow="hidden"
        style={{ position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/about-mission-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            opacity: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9))",
          }}
        />
        <Column
          fillWidth
          maxWidth="s"
          gap="32"
          horizontal="center"
          align="center"
          style={{ position: "relative", zIndex: 1 }}
        >
          <Text
            variant="label-default-s"
            onBackground="neutral-weak"
            style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
          >
            Our Mission
          </Text>
          <Heading variant="display-strong-l" wrap="balance" align="center">
            Built for the firms that win
          </Heading>
          <Column gap="20">
            <Text variant="body-default-m" onBackground="neutral-weak" align="center">
              The legal industry spends billions on marketing that doesn&rsquo;t work — generic ads,
              unqualified leads, and vendors who sell the same contacts to every firm in town.
            </Text>
            <Text variant="body-default-m" onBackground="neutral-weak" align="center">
              Semperr was founded on a simple premise: law firms deserve better. We built proprietary
              data sourcing technology that identifies people actively seeking legal representation —
              from court filings and search behavior to direct inquiries — and delivers them to our
              partner firms in real time.
            </Text>
            <Text variant="body-default-m" onBackground="neutral-weak" align="center">
              We limit the number of firms we work with in each market. That means when you partner
              with us, the leads we deliver are yours — not recycled contacts shared across
              competitors.
            </Text>
          </Column>
        </Column>
      </Column>

      {/* How We Work */}
      <Column fillWidth horizontal="center" paddingY="80" paddingX="l">
        <Column fillWidth maxWidth="m" gap="64">
          <Column gap="8">
            <Text
              variant="label-default-s"
              onBackground="neutral-weak"
              style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
            >
              How We Work
            </Text>
            <Heading variant="display-strong-m">
              Three steps to a fuller pipeline
            </Heading>
          </Column>
          <Row fillWidth gap="xl" s={{ direction: "column", gap: "xl" }}>
            {[
              {
                step: "01",
                title: "Source",
                description:
                  "We aggregate lead data from dozens of high-intent sources — court filings, search behavior, form submissions, and licensed data providers — all verified for accuracy and relevance.",
              },
              {
                step: "02",
                title: "Qualify",
                description:
                  "Every lead is screened against your firm's practice areas, geography, and ideal client profile. We don't send volume for volume's sake — we send leads that match.",
              },
              {
                step: "03",
                title: "Deliver",
                description:
                  "Qualified leads arrive in real time via your preferred channel — CRM, email, phone, or custom API. We work alongside your intake team to optimize conversion.",
              },
            ].map((item) => (
              <Column key={item.step} flex={1} gap="16">
                <Text variant="display-strong-l" onBackground="brand-strong">
                  {item.step}
                </Text>
                <Heading as="h3" variant="heading-strong-l">
                  {item.title}
                </Heading>
                <Text variant="body-default-m" onBackground="neutral-weak">
                  {item.description}
                </Text>
              </Column>
            ))}
          </Row>
        </Column>
      </Column>

      {/* Values */}
      <Row
        fillWidth
        overflow="hidden"
        style={{ position: "relative", minHeight: "600px" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/about-values-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(0,0,0,0.92) 50%, rgba(0,0,0,0.3) 100%)",
          }}
        />
        <Column
          fillWidth
          maxWidth="m"
          paddingY="80"
          paddingX="l"
          gap="48"
          horizontal="start"
          style={{ position: "relative", zIndex: 1, margin: "0 auto" }}
        >
          <Column gap="8" style={{ maxWidth: "520px" }}>
            <Text
              variant="label-default-s"
              onBackground="neutral-weak"
              style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
            >
              Our Values
            </Text>
            <Heading variant="display-strong-m">
              What we stand for
            </Heading>
          </Column>
          <Column gap="40" style={{ maxWidth: "520px" }}>
            {[
              {
                title: "Exclusivity",
                description:
                  "We cap the number of firms we serve per market. Your competitive advantage is our priority — we never sell the same lead twice.",
              },
              {
                title: "Transparency",
                description:
                  "You always know where your leads come from, what they cost, and how they convert. No black boxes, no hidden fees, no surprises.",
              },
              {
                title: "Partnership",
                description:
                  "We don't just deliver leads and disappear. We embed with your intake team, optimize conversion workflows, and grow alongside your firm.",
              },
            ].map((value) => (
              <Column key={value.title} gap="8">
                <Heading as="h3" variant="heading-strong-l">
                  {value.title}
                </Heading>
                <Text variant="body-default-m" onBackground="neutral-weak">
                  {value.description}
                </Text>
              </Column>
            ))}
          </Column>
        </Column>
      </Row>

      {/* Practice Areas */}
      <Column fillWidth horizontal="center" paddingY="80" paddingX="l">
        <Column fillWidth maxWidth="m" gap="48">
          <Column gap="8">
            <Text
              variant="label-default-s"
              onBackground="neutral-weak"
              style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
            >
              Practice Areas
            </Text>
            <Heading variant="display-strong-m">
              Industries we serve
            </Heading>
          </Column>
          <Row fillWidth gap="24" wrap s={{ direction: "column" }}>
            {[
              "Personal Injury",
              "Mass Tort",
              "Medical Malpractice",
              "Workers' Compensation",
              "Product Liability",
              "Wrongful Death",
            ].map((area) => (
              <Column
                key={area}
                padding="32"
                border="neutral-alpha-weak"
                radius="l"
                flex={1}
                style={{ minWidth: "260px" }}
              >
                <Heading as="h3" variant="heading-strong-l">
                  {area}
                </Heading>
              </Column>
            ))}
          </Row>
        </Column>
      </Column>

      {/* CTA */}
      <Column
        fillWidth
        horizontal="center"
        align="center"
        paddingY="104"
        paddingX="l"
        gap="24"
        overflow="hidden"
        style={{ position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/projects/project-01/hero-02.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.85))",
          }}
        />
        <Heading
          variant="display-strong-m"
          wrap="balance"
          align="center"
          style={{ position: "relative", zIndex: 1 }}
        >
          Ready to grow your caseload?
        </Heading>
        <Text
          variant="body-default-m"
          onBackground="neutral-weak"
          wrap="balance"
          align="center"
          style={{ position: "relative", zIndex: 1, maxWidth: "480px" }}
        >
          Schedule a call to learn how Semperr can deliver pre-qualified leads tailored to your firm.
        </Text>
        <Row gap="16" paddingTop="8" style={{ position: "relative", zIndex: 1 }}>
          <Button
            href="https://cal.com/maherhasan"
            variant="secondary"
            size="m"
            arrowIcon
          >
            Schedule a Call
          </Button>
          <Button
            href="mailto:join@semperr.com"
            variant="tertiary"
            size="m"
          >
            Get in Touch
          </Button>
        </Row>
      </Column>
    </Column>
  );
}
