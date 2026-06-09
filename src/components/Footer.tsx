import { Column, Row, Line, SmartLink, Text, Icon } from "@once-ui-system/core";

const footerLink = { textDecoration: "none" };

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <SmartLink href={href} style={footerLink}>
      <Row gap="8" vertical="center">
        <Text variant="body-default-s" onBackground="neutral-weak">
          {children}
        </Text>
        <Icon name="arrowRight" size="xs" onBackground="neutral-weak" />
      </Row>
    </SmartLink>
  );
}

export const Footer = () => {
  return (
    <Column as="footer" fillWidth paddingTop="80" paddingX="l" horizontal="center">
      <Line fillWidth background="neutral-alpha-weak" />

      <Row
        fillWidth
        maxWidth="l"
        paddingY="64"
        gap="xl"
        horizontal="between"
        wrap
        s={{ direction: "column", gap: "48" }}
      >
        {/* Platform */}
        <Column gap="16" style={{ minWidth: "160px" }}>
          <Text variant="label-strong-s" onBackground="neutral-strong">
            Platform
          </Text>
          <Column gap="12">
            <FooterLink href="/about">Lead Intelligence</FooterLink>
            <FooterLink href="/about">Data Sources</FooterLink>
            <FooterLink href="/about">Real-Time Delivery</FooterLink>
            <FooterLink href="/work">ROI Calculator</FooterLink>
          </Column>
        </Column>

        {/* Solutions */}
        <Column gap="16" style={{ minWidth: "160px" }}>
          <Text variant="label-strong-s" onBackground="neutral-strong">
            Solutions
          </Text>
          <Column gap="12">
            <FooterLink href="/about">Personal Injury</FooterLink>
            <FooterLink href="/about">Mass Tort</FooterLink>
            <FooterLink href="/about">Medical Malpractice</FooterLink>
            <FooterLink href="/about">Workers&#39; Compensation</FooterLink>
          </Column>
        </Column>

        {/* Company */}
        <Column gap="16" style={{ minWidth: "160px" }}>
          <Text variant="label-strong-s" onBackground="neutral-strong">
            Company
          </Text>
          <Column gap="12">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/blog">Newsroom</FooterLink>
            <FooterLink href="https://cal.com/maherhasan">Request a Demo</FooterLink>
            <FooterLink href="mailto:join@semperr.com">Contact</FooterLink>
          </Column>
        </Column>

        {/* Resources */}
        <Column gap="16" style={{ minWidth: "160px" }}>
          <Text variant="label-strong-s" onBackground="neutral-strong">
            Resources
          </Text>
          <Column gap="12">
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/work">Resources Hub</FooterLink>
            <FooterLink href="/blog">Case Studies</FooterLink>
          </Column>
        </Column>

        {/* Legal */}
        <Column gap="16" style={{ minWidth: "160px" }}>
          <Text variant="label-strong-s" onBackground="neutral-strong">
            Legal
          </Text>
          <Column gap="12">
            <FooterLink href="/terms">Terms &amp; Conditions</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
          </Column>
        </Column>
      </Row>

      <Line fillWidth background="neutral-alpha-weak" />

      {/* Bottom bar */}
      <Row
        fillWidth
        maxWidth="l"
        paddingY="24"
        horizontal="between"
        vertical="center"
        gap="24"
        s={{ direction: "column", gap: "16", horizontal: "center" }}
      >
        <Row gap="24" vertical="center">
          <Text
            variant="heading-default-s"
            onBackground="neutral-weak"
            style={{ letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 400 }}
          >
            Semperr
          </Text>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            &copy; 2026 Harvey AI Corporation. All rights reserved.
          </Text>
        </Row>
        <Row gap="16" vertical="center">
          <Text variant="label-strong-xs" onBackground="neutral-weak">
            Follow
          </Text>
          <SmartLink href="https://www.linkedin.com/company/semperr/" style={footerLink}>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              LinkedIn
            </Text>
          </SmartLink>
          <SmartLink href="https://x.com/semperr" style={footerLink}>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              X
            </Text>
          </SmartLink>
        </Row>
      </Row>

      {/* Mobile bottom spacer */}
      <Row height="80" hide s={{ hide: false }} />
    </Column>
  );
};
