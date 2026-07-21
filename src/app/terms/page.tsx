import { Column, Heading, Text } from "@once-ui-system/core";
import { Meta } from "@/utils/meta";
import { baseURL } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: "Terms & Conditions — Semperr",
    description: "Terms and conditions governing the use of Semperr services.",
    baseURL: baseURL,
    path: "/terms",
  });
}

export default function Terms() {
  return (
    <Column maxWidth="s" gap="l" paddingY="64" paddingX="l" horizontal="center">
      <Heading variant="display-strong-m">Terms &amp; Conditions</Heading>
      <Text variant="body-default-s" onBackground="neutral-weak">
        Last updated: June 2026
      </Text>

      <Column gap="m">
        <Heading as="h2" variant="heading-strong-l">1. Agreement to Terms</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          By accessing or using the services provided by Semperr (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these Terms &amp; Conditions. If you do not agree, you may not use our services. These terms apply to all visitors, users, and clients who access or use our services.
        </Text>

        <Heading as="h2" variant="heading-strong-l">2. Services</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Semperr provides data brokerage and lead generation services to law firms. Our services include sourcing, verifying, and delivering pre-qualified leads to legal professionals. The specific scope of services, pricing, and delivery terms are defined in individual service agreements executed between Semperr and each client.
        </Text>

        <Heading as="h2" variant="heading-strong-l">3. Client Obligations</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Clients agree to use leads and data provided by Semperr solely for lawful purposes and in compliance with all applicable federal, state, and local laws, including but not limited to the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, and applicable state bar rules of professional conduct. Clients shall not resell, redistribute, or share lead data with third parties without prior written consent from Semperr.
        </Text>

        <Heading as="h2" variant="heading-strong-l">4. Lead Quality &amp; Delivery</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Semperr strives to deliver accurate, verified, and high-intent leads. However, we do not guarantee that every lead will result in a signed retainer or successful engagement. Lead quality is measured against agreed-upon criteria outlined in the applicable service agreement. Disputes regarding lead quality must be raised within the timeframe specified in your service agreement.
        </Text>

        <Heading as="h2" variant="heading-strong-l">5. Payment Terms</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Payment terms, including pricing, billing cycles, and accepted payment methods, are outlined in each client&rsquo;s service agreement. Late payments may be subject to interest charges and suspension of services. Semperr reserves the right to modify pricing with 30 days&rsquo; written notice.
        </Text>

        <Heading as="h2" variant="heading-strong-l">6. Confidentiality</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Both parties agree to maintain the confidentiality of proprietary information, trade secrets, and business strategies disclosed during the course of the engagement. This obligation survives the termination of any service agreement.
        </Text>

        <Heading as="h2" variant="heading-strong-l">7. Limitation of Liability</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          To the maximum extent permitted by law, Semperr shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to the use of our services. Our total liability shall not exceed the fees paid by the client in the twelve (12) months preceding the claim.
        </Text>

        <Heading as="h2" variant="heading-strong-l">8. Termination</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Either party may terminate a service agreement with 30 days&rsquo; written notice. Semperr reserves the right to immediately suspend or terminate services if a client violates these terms or engages in unlawful conduct. Upon termination, clients must cease use of all lead data previously provided.
        </Text>

        <Heading as="h2" variant="heading-strong-l">9. Governing Law</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          These terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in New York County, New York.
        </Text>

        <Heading as="h2" variant="heading-strong-l">10. Changes to Terms</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Semperr reserves the right to update these terms at any time. Material changes will be communicated to clients via email or through our website. Continued use of our services following any changes constitutes acceptance of the revised terms.
        </Text>

        <Heading as="h2" variant="heading-strong-l">Contact</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Questions about these terms may be directed to join@semperr.com or by mail to 99 Wall St, New York, NY 10005.
        </Text>
      </Column>
    </Column>
  );
}
