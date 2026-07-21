import Image from "next/image";
import {
  Heading,
  Text,
  Button,
  Avatar,
  Column,
  Badge,
  Row,
  Schema,
  Line,
  Icon,
  RevealFx,
} from "@once-ui-system/core";
import { home, about, person, baseURL, routes } from "@/resources";
import { Meta } from "@/utils/meta";
import { Mailchimp } from "@/components";
import { Projects } from "@/components/work/Projects";
import { Posts } from "@/components/blog/Posts";

export async function generateMetadata() {
  return Meta.generate({
    title: home.title,
    description: home.description,
    baseURL: baseURL,
    path: home.path,
    image: home.image,
  });
}

export default function Home() {
  return (
    <Column maxWidth="m" gap="xl" paddingY="12" horizontal="center">
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={home.path}
        title={home.title}
        description={home.description}
        image={`/api/og/generate?title=${encodeURIComponent(home.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Column fillWidth horizontal="center" gap="m">
        <Column maxWidth="s" horizontal="center" align="center">
          {home.featured.display && (
            <RevealFx
              fillWidth
              horizontal="center"
              paddingTop="16"
              paddingBottom="32"
              paddingLeft="12"
            >
              <Badge
                background="brand-alpha-weak"
                paddingX="12"
                paddingY="4"
                onBackground="neutral-strong"
                textVariant="label-default-s"
                arrow={false}
                href={home.featured.href}
              >
                <Row paddingY="2">{home.featured.title}</Row>
              </Badge>
            </RevealFx>
          )}
          <RevealFx translateY="4" fillWidth horizontal="center" paddingBottom="16">
            <Heading wrap="balance" variant="display-strong-l">
              {home.headline}
            </Heading>
          </RevealFx>
          <RevealFx translateY="8" delay={0.2} fillWidth horizontal="center" paddingBottom="32">
            <Text wrap="balance" onBackground="neutral-weak" variant="body-default-m">
              {home.subline}
            </Text>
          </RevealFx>
        </Column>
      </Column>
      <RevealFx translateY="16" delay={0.6}>
        <Projects range={[1, 1]} />
      </RevealFx>

      {/* Stats bar */}
      <RevealFx translateY="8">
        <Row
          fillWidth
          horizontal="center"
          gap="xl"
          paddingY="48"
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
      </RevealFx>

      <Projects range={[2, 2]} />

      {/* Testimonial */}
      <RevealFx translateY="8">
        <Column
          fillWidth
          horizontal="center"
          align="center"
          paddingY="48"
          paddingX="l"
          gap="20"
        >
          <Text
            variant="heading-default-l"
            onBackground="neutral-strong"
            wrap="balance"
            style={{ fontStyle: "italic", textAlign: "center" }}
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
      </RevealFx>

      <Projects range={[3, 3]} />

      {/* CTA banner */}
      <RevealFx translateY="8" fillWidth>
        <Column
          fillWidth
          horizontal="center"
          align="center"
          paddingY="80"
          paddingX="l"
          gap="24"
          radius="xl"
          overflow="hidden"
          style={{
            position: "relative",
          }}
        >
          <Image
            src="/images/cta-bg.png"
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: "cover", opacity: 0.9 }}
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
            Schedule a call to see how Semperr can deliver qualified leads to your firm.
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
      </RevealFx>

      {routes["/blog"] && (
        <Column fillWidth gap="24" marginBottom="l">
          <Row fillWidth paddingRight="64">
            <Line maxWidth={48} />
          </Row>
          <Row fillWidth gap="24" marginTop="40" s={{ direction: "column" }}>
            <Row flex={1} paddingLeft="l" paddingTop="24">
              <Heading as="h2" variant="display-strong-xs" wrap="balance">
                Latest insights
              </Heading>
            </Row>
            <Row flex={3} paddingX="20">
              <Posts range={[1, 2]} columns="2" />
            </Row>
          </Row>
          <Row fillWidth paddingLeft="64" horizontal="end">
            <Line maxWidth={48} />
          </Row>
        </Column>
      )}
      <Mailchimp />
    </Column>
  );
}
