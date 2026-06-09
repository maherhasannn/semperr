import { Column, Heading, Text, Meta } from "@once-ui-system/core";
import { baseURL } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: "Privacy Policy — Semperr",
    description: "How Semperr collects, uses, and protects your information.",
    baseURL: baseURL,
    path: "/privacy",
  });
}

export default function Privacy() {
  return (
    <Column maxWidth="s" gap="l" paddingY="64" paddingX="l" horizontal="center">
      <Heading variant="display-strong-m">Privacy Policy</Heading>
      <Text variant="body-default-s" onBackground="neutral-weak">
        Last updated: June 2026
      </Text>

      <Column gap="m">
        <Heading as="h2" variant="heading-strong-l">1. Introduction</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Semperr (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting the privacy and security of the personal information we collect and process. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you visit our website or engage with our services.
        </Text>

        <Heading as="h2" variant="heading-strong-l">2. Information We Collect</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          We may collect the following types of information: contact information (name, email address, phone number, mailing address) provided when you inquire about or subscribe to our services; business information related to your law firm, practice areas, and geographic coverage; usage data including IP address, browser type, pages visited, and time spent on our website; and lead data sourced from public records, court filings, online inquiries, and other lawful data sources in the course of providing our services.
        </Text>

        <Heading as="h2" variant="heading-strong-l">3. How We Use Your Information</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          We use collected information to provide, maintain, and improve our lead generation services; to communicate with clients about service updates, billing, and support; to personalize lead targeting based on practice area, geography, and client preferences; to comply with legal obligations and enforce our terms of service; and to analyze website usage and improve user experience.
        </Text>

        <Heading as="h2" variant="heading-strong-l">4. Data Sourcing &amp; Lead Information</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Semperr sources lead data from publicly available records, licensed data providers, online form submissions, and other lawful sources. All data sourcing practices comply with applicable federal and state regulations, including the Fair Credit Reporting Act (FCRA) where applicable, state data broker registration requirements, and the California Consumer Privacy Act (CCPA). We do not purchase or sell consumer data from or to unauthorized third parties.
        </Text>

        <Heading as="h2" variant="heading-strong-l">5. Information Sharing</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          We share lead data with our law firm clients solely for the purpose of legal representation outreach. We may also share information with service providers who assist us in operating our business (e.g., hosting, analytics, payment processing), and as required by law, regulation, legal process, or governmental request. We do not sell personal information to third parties for marketing purposes.
        </Text>

        <Heading as="h2" variant="heading-strong-l">6. Data Security</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          We implement industry-standard security measures to protect personal information from unauthorized access, alteration, disclosure, or destruction. These measures include encryption of data in transit and at rest, access controls and authentication protocols, regular security assessments, and employee training on data handling practices. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </Text>

        <Heading as="h2" variant="heading-strong-l">7. Data Retention</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          We retain personal information only for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Lead data retention periods are defined in individual client service agreements.
        </Text>

        <Heading as="h2" variant="heading-strong-l">8. Your Rights</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Depending on your jurisdiction, you may have the right to access, correct, or delete your personal information; opt out of the sale or sharing of your personal information; request a copy of the data we hold about you; and withdraw consent for data processing where consent is the basis for processing. To exercise these rights, contact us at join@semperr.com.
        </Text>

        <Heading as="h2" variant="heading-strong-l">9. Cookies &amp; Tracking</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Our website may use cookies and similar technologies to enhance user experience, analyze website traffic, and understand how visitors interact with our site. You can control cookie preferences through your browser settings. Disabling cookies may limit certain features of our website.
        </Text>

        <Heading as="h2" variant="heading-strong-l">10. Changes to This Policy</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. We encourage you to review this policy periodically.
        </Text>

        <Heading as="h2" variant="heading-strong-l">Contact</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          For questions or concerns about this Privacy Policy, contact us at join@semperr.com, call (929) 505-3099, or write to 99 Wall St, New York, NY 10005.
        </Text>
      </Column>
    </Column>
  );
}
