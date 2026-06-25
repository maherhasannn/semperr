"use client";

import { usePathname } from "next/navigation";
import { Column, Row, Line, SmartLink, Text, IconButton } from "@once-ui-system/core";
import { social } from "@/resources";

const footerLink = { textDecoration: "none" };

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <SmartLink href={href} style={footerLink}>
      <Text variant="body-default-s" onBackground="neutral-weak">
        {children}
      </Text>
    </SmartLink>
  );
}

export const Footer = () => {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <Column as="footer" fillWidth paddingTop="80" paddingX="l" horizontal="center">
      <Line fillWidth background="neutral-alpha-weak" />

      <Row
        fillWidth
        maxWidth="l"
        paddingY="64"
        gap="xl"
        horizontal="between"
        s={{ direction: "column", gap: "48" }}
      >
        {/* Brand column */}
        <Column gap="16" style={{ minWidth: "200px", maxWidth: "240px" }}>
          <Text
            variant="heading-default-s"
            onBackground="neutral-weak"
            style={{ letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 400 }}
          >
            Semperr
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak">
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

        {/* Link columns */}
        <Row gap="xl" s={{ direction: "column", gap: "48" }}>
          {/* Platform */}
          <Column gap="16" style={{ minWidth: "150px" }}>
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
          <Column gap="16" style={{ minWidth: "150px" }}>
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
          <Column gap="16" style={{ minWidth: "150px" }}>
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
          <Column gap="16" style={{ minWidth: "150px" }}>
            <Text variant="label-strong-s" onBackground="neutral-strong">
              Resources
            </Text>
            <Column gap="12">
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/work">Resources Hub</FooterLink>
              <FooterLink href="/blog">Case Studies</FooterLink>
            </Column>
          </Column>

        </Row>
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
        <Text variant="body-default-xs" onBackground="neutral-weak">
          &copy; 2026 Semperr. All rights reserved.
        </Text>
        <Row gap="16" vertical="center">
          <SmartLink href="/terms" style={footerLink}>
            <Text variant="body-default-xs" onBackground="neutral-weak">Terms</Text>
          </SmartLink>
          <SmartLink href="/privacy" style={footerLink}>
            <Text variant="body-default-xs" onBackground="neutral-weak">Privacy</Text>
          </SmartLink>
        </Row>
      </Row>

      {/* Mobile bottom spacer */}
      <Row height="80" hide s={{ hide: false }} />
    </Column>
  );
};
