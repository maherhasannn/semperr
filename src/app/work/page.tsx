import {
  Column,
  Heading,
  Text,
  Meta,
  Schema,
  Row,
  Line,
  RevealFx,
  Button,
} from "@once-ui-system/core";
import { baseURL, about, person, work } from "@/resources";
import { ROICalculator } from "@/components/ROICalculator";

export async function generateMetadata() {
  return Meta.generate({
    title: work.title,
    description: work.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(work.title)}`,
    path: work.path,
  });
}

export default function Work() {
  return (
    <Column fillWidth>
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={work.path}
        title={work.title}
        description={work.description}
        image={`/api/og/generate?title=${encodeURIComponent(work.title)}`}
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
            ROI Calculator
          </Text>
        </RevealFx>
        <RevealFx translateY="8" delay={0.1}>
          <Heading
            variant="display-strong-xl"
            wrap="balance"
            align="center"
            style={{ maxWidth: "800px" }}
          >
            See Semperr&rsquo;s impact on your firm
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
            This calculator estimates the revenue impact of partnering with Semperr,
            using conservative assumptions informed by our client data.
          </Text>
        </RevealFx>
      </Column>

      {/* Calculator */}
      <Column fillWidth horizontal="center" paddingX="l" paddingBottom="80">
        <Column fillWidth maxWidth="m">
          <RevealFx translateY="16" delay={0.4}>
            <ROICalculator />
          </RevealFx>
        </Column>
      </Column>

      {/* Social proof stats */}
      <Column fillWidth horizontal="center" paddingX="l" background="neutral-alpha-weak">
        <Row
          fillWidth
          maxWidth="m"
          horizontal="center"
          gap="xl"
          paddingY="64"
          s={{ direction: "column", gap: "l", horizontal: "center", align: "center" }}
        >
          {[
            { value: "35%", label: "Average conversion rate improvement" },
            { value: "25%", label: "Average lead volume increase" },
            { value: "90 days", label: "Average time to see measurable ROI" },
          ].map((stat) => (
            <Column key={stat.label} horizontal="center" align="center" gap="4">
              <Text variant="display-strong-l" onBackground="brand-strong">
                {stat.value}
              </Text>
              <Text variant="body-default-s" onBackground="neutral-weak" align="center">
                {stat.label}
              </Text>
            </Column>
          ))}
        </Row>
      </Column>

      {/* Testimonial */}
      <Column
        fillWidth
        horizontal="center"
        align="center"
        paddingY="80"
        paddingX="l"
        gap="20"
      >
        <Text
          variant="heading-default-l"
          onBackground="neutral-strong"
          wrap="balance"
          style={{ fontStyle: "italic", textAlign: "center", maxWidth: "640px" }}
        >
          &ldquo;Semperr transformed our intake process. We went from chasing leads to choosing
          clients — our caseload doubled in six months.&rdquo;
        </Text>
        <Column horizontal="center" align="center" gap="4">
          <Text variant="body-strong-s" onBackground="neutral-strong">
            Managing Partner
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Top 50 Personal Injury Firm, Florida
          </Text>
        </Column>
      </Column>

      {/* CTA */}
      <Column
        fillWidth
        horizontal="center"
        align="center"
        paddingY="80"
        paddingX="l"
        gap="24"
        overflow="hidden"
        style={{ position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/cta-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 1,
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
          as="h2"
          variant="display-strong-m"
          wrap="balance"
          align="center"
          style={{ position: "relative", zIndex: 1 }}
        >
          Ready to see these numbers for real?
        </Heading>
        <Text
          variant="body-default-m"
          onBackground="neutral-weak"
          wrap="balance"
          align="center"
          style={{ position: "relative", zIndex: 1 }}
        >
          Schedule a call to discuss how Semperr can deliver these results for your firm.
        </Text>
        <Button
          href="https://cal.com/maherhasan"
          variant="secondary"
          size="m"
          arrowIcon
          style={{ position: "relative", zIndex: 1 }}
        >
          Schedule a Call
        </Button>
      </Column>
    </Column>
  );
}
