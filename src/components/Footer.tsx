import { Column, Row, Line, SmartLink, Text, IconButton } from "@once-ui-system/core";
import { social } from "@/resources";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Column as="footer" fillWidth paddingTop="64" paddingBottom="32" paddingX="l" gap="48" horizontal="center">
      <Line fillWidth background="neutral-alpha-weak" />
      <Row
        fillWidth
        maxWidth="m"
        gap="xl"
        horizontal="between"
        s={{ direction: "column", gap: "xl" }}
      >
        {/* Brand column */}
        <Column gap="16" minWidth={200}>
          <Text
            variant="heading-default-s"
            onBackground="neutral-weak"
            style={{ letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 400 }}
          >
            Semperr
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak" style={{ maxWidth: "240px" }}>
            Data brokerage for law firms. Pre-qualified leads, delivered.
          </Text>
          <Row gap="8">
            {social.map(
              (item) =>
                item.link && (
                  <IconButton
                    key={item.name}
                    href={item.link}
                    icon={item.icon}
                    tooltip={item.name}
                    size="s"
                    variant="ghost"
                  />
                ),
            )}
          </Row>
        </Column>

        {/* Navigation column */}
        <Column gap="16" minWidth={120}>
          <Text variant="label-strong-s" onBackground="neutral-strong">
            Company
          </Text>
          <Column gap="8">
            <SmartLink href="/about" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="neutral-weak">About</Text>
            </SmartLink>
            <SmartLink href="/work" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="neutral-weak">Resources</Text>
            </SmartLink>
            <SmartLink href="/blog" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="neutral-weak">Insights</Text>
            </SmartLink>
            <SmartLink href="https://cal.com/maherhasan" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="neutral-weak">Request a Demo</Text>
            </SmartLink>
          </Column>
        </Column>

        {/* Legal column */}
        <Column gap="16" minWidth={120}>
          <Text variant="label-strong-s" onBackground="neutral-strong">
            Legal
          </Text>
          <Column gap="8">
            <SmartLink href="/terms" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="neutral-weak">Terms &amp; Conditions</Text>
            </SmartLink>
            <SmartLink href="/privacy" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="neutral-weak">Privacy Policy</Text>
            </SmartLink>
          </Column>
        </Column>

        {/* Contact column */}
        <Column gap="16" minWidth={180}>
          <Text variant="label-strong-s" onBackground="neutral-strong">
            Contact
          </Text>
          <Column gap="8">
            <SmartLink href="mailto:join@semperr.com" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="neutral-weak">join@semperr.com</Text>
            </SmartLink>
            <SmartLink href="tel:+19295053099" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="neutral-weak">(929) 505-3099</Text>
            </SmartLink>
            <Text variant="body-default-s" onBackground="neutral-weak">
              99 Wall St<br />New York, NY 10005
            </Text>
            <SmartLink href="https://cal.com/maherhasan" style={{ textDecoration: "none" }}>
              <Text variant="body-default-s" onBackground="brand-strong">Schedule a Call</Text>
            </SmartLink>
          </Column>
        </Column>
      </Row>

      {/* Bottom bar */}
      <Row fillWidth maxWidth="m" horizontal="between" vertical="center" s={{ direction: "column", gap: "8" }}>
        <Text variant="body-default-xs" onBackground="neutral-weak">
          &copy; {currentYear} Semperr. All rights reserved.
        </Text>
        <Row gap="16">
          <SmartLink href="/terms" style={{ textDecoration: "none" }}>
            <Text variant="body-default-xs" onBackground="neutral-weak">Terms</Text>
          </SmartLink>
          <SmartLink href="/privacy" style={{ textDecoration: "none" }}>
            <Text variant="body-default-xs" onBackground="neutral-weak">Privacy</Text>
          </SmartLink>
        </Row>
      </Row>

      {/* Mobile bottom spacer */}
      <Row height="80" hide s={{ hide: false }} />
    </Column>
  );
};
