import Image from "next/image";
import {
  Column,
  Heading,
  Text,
  Button,
  Row,
  Schema,
  RevealFx,
  Line,
  Icon,
} from "@once-ui-system/core";
import { baseURL, gallery, person, about } from "@/resources";
import { Meta } from "@/utils/meta";

export async function generateMetadata() {
  return Meta.generate({
    title: gallery.title,
    description: gallery.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(gallery.title)}`,
    path: gallery.path,
  });
}

export default function Gallery() {
  return (
    <Column fillWidth>
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={gallery.title}
        description={gallery.description}
        path={gallery.path}
        image={`/api/og/generate?title=${encodeURIComponent(gallery.title)}`}
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
            Get Started
          </Text>
        </RevealFx>
        <RevealFx translateY="8" delay={0.1}>
          <Heading
            variant="display-strong-xl"
            wrap="balance"
            align="center"
            style={{ maxWidth: "800px" }}
          >
            See Semperr in action
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
            Book a 30-minute call with our team. We&rsquo;ll walk you through
            how Semperr sources, qualifies, and delivers leads tailored to your firm.
          </Text>
        </RevealFx>
        <RevealFx translateY="8" delay={0.3}>
          <Button
            href="https://cal.com/maherhasan"
            variant="secondary"
            size="l"
            arrowIcon
          >
            Schedule a Demo
          </Button>
        </RevealFx>
      </Column>

      {/* What to expect */}
      <Column fillWidth horizontal="center" paddingX="l">
        <Line fillWidth background="neutral-alpha-weak" maxWidth="m" />
      </Column>
      <Column fillWidth horizontal="center" paddingY="80" paddingX="l">
        <Column fillWidth maxWidth="m" gap="64">
          <RevealFx translateY="8">
            <Column gap="8">
              <Text
                variant="label-default-s"
                onBackground="neutral-weak"
                style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
              >
                What to Expect
              </Text>
              <Heading variant="display-strong-m">
                Your demo, step by step
              </Heading>
            </Column>
          </RevealFx>
          <Row fillWidth gap="xl" s={{ direction: "column", gap: "xl" }}>
            {[
              {
                step: "01",
                title: "Discovery",
                description:
                  "We learn about your firm — practice areas, geography, intake capacity, and growth goals.",
              },
              {
                step: "02",
                title: "Platform walkthrough",
                description:
                  "See how our data sourcing and lead qualification engine works, with examples from firms like yours.",
              },
              {
                step: "03",
                title: "Custom projection",
                description:
                  "We model the lead volume, conversion rates, and revenue impact you can expect with Semperr.",
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

      {/* Who it's for */}
      <Column fillWidth horizontal="center" paddingX="l" background="neutral-alpha-weak">
        <Column fillWidth maxWidth="m" paddingY="80" gap="48">
          <Column gap="8">
            <Text
              variant="label-default-s"
              onBackground="neutral-weak"
              style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
            >
              Who It&rsquo;s For
            </Text>
            <Heading variant="display-strong-m">
              Built for firms ready to grow
            </Heading>
          </Column>
          <Row fillWidth gap="24" wrap s={{ direction: "column" }}>
            {[
              "Personal injury firms looking to scale caseload",
              "Mass tort practices building plaintiff inventories",
              "Managing partners tired of paying for unqualified leads",
              "Intake teams overwhelmed by low-quality volume",
            ].map((item) => (
              <Row
                key={item}
                flex={1}
                padding="24"
                border="neutral-alpha-weak"
                radius="l"
                gap="12"
                vertical="center"
                style={{ minWidth: "260px" }}
              >
                <Icon name="check" onBackground="brand-strong" size="m" />
                <Text variant="body-default-m" onBackground="neutral-strong">
                  {item}
                </Text>
              </Row>
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
        <Image
          src="/images/cta-bg.png"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.85))",
          }}
        />
        <Heading
          as="h2"
          variant="display-strong-m"
          wrap="balance"
          align="center"
          style={{ position: "relative", zIndex: 1 }}
        >
          Ready to fill your pipeline?
        </Heading>
        <Text
          variant="body-default-m"
          onBackground="neutral-weak"
          wrap="balance"
          align="center"
          style={{ position: "relative", zIndex: 1 }}
        >
          No commitment, no pressure — just a conversation about what Semperr can do for your firm.
        </Text>
        <Row gap="16" paddingTop="8" style={{ position: "relative", zIndex: 1 }}>
          <Button
            href="https://cal.com/maherhasan"
            variant="secondary"
            size="m"
            arrowIcon
          >
            Schedule a Demo
          </Button>
          <Button
            href="mailto:join@semperr.com"
            variant="tertiary"
            size="m"
          >
            Email Us
          </Button>
        </Row>
      </Column>
    </Column>
  );
}
