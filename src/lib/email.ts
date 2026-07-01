import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const RELATIONSHIP_MANAGER_NAME = "Jerry Gustafson";

function tierLabel(tier: number) {
  return `Tier ${tier}`;
}

function tierCopy(tier: number) {
  if (tier === 1) {
    return "Because you are Tier 1, you have exclusivity for your specific vertical in your state as long as you stay in good standing. That means your payment method stays valid, payments do not bounce, and your reviews remain strong.";
  }

  return "Since a Tier 1 firm already holds exclusivity in that state and we only sell exclusive leads, you will receive leads less frequently. If space opens up and you continue performing well, we can move you up.";
}

export async function sendNewLeadEmail(
  to: string,
  firmName: string,
  contactName: string | null,
  lead: {
    claimant_name: string | null;
    claimant_contact?: string | null;
    claimant_phone?: string | null;
    claimant_email?: string | null;
    state: string;
    case_type: string;
    price_cents: number;
  },
) {
  const firstName = contactName?.split(" ")[0] ?? "there";
  const claimant = lead.claimant_name ?? "New claimant";
  const price = `$${(lead.price_cents / 100).toFixed(0)}`;
  const caseLabel = lead.case_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const contactRows = [
    lead.claimant_phone ? { label: "Phone", value: lead.claimant_phone } : null,
    lead.claimant_email ? { label: "Email", value: lead.claimant_email } : null,
    !lead.claimant_phone && !lead.claimant_email && lead.claimant_contact
      ? { label: "Contact", value: lead.claimant_contact }
      : null,
  ]
    .filter(Boolean)
    .map(
      (row) => `
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:12px;color:#5C636B;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">${row!.label}</span><br/>
                    <span style="font-size:15px;color:#F2F4F5;font-weight:500;">${row!.value}</span>
                  </td>
                </tr>`,
    )
    .join("");

  await resend.emails.send({
    from: "Semperr <no-reply@semperr.com>",
    to,
    subject: `New lead for ${firmName} — ${claimant} (${lead.state})`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0B0D;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0B0D;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="padding-bottom:40px;">
              <span style="font-size:14px;letter-spacing:0.3em;text-transform:uppercase;color:#6b727a;font-weight:400;">SEMPERR</span>
            </td>
          </tr>
          <tr>
            <td style="background:#111214;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:44px 40px;">
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:rgba(91,225,239,0.1);border:1px solid rgba(91,225,239,0.25);border-radius:20px;padding:6px 14px;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#5BE1EF;margin-right:8px;vertical-align:middle;"></span>
                    <span style="font-size:12px;color:#5BE1EF;font-weight:600;letter-spacing:0.04em;vertical-align:middle;">NEW LEAD</span>
                  </td>
                </tr>
              </table>
              <h1 style="font-size:26px;color:#F2F4F5;font-weight:700;margin:0 0 14px;line-height:1.3;">
                Hey ${firstName}, you have a new lead.
              </h1>
              <p style="font-size:15px;color:#888F96;line-height:1.7;margin:0 0 28px;">
                A new <strong style="color:#F2F4F5;">${caseLabel}</strong> lead has been delivered to <strong style="color:#F2F4F5;">${firmName}</strong>. Review the details in your dashboard.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 24px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:12px;color:#5C636B;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Claimant</span><br/>
                    <span style="font-size:15px;color:#F2F4F5;font-weight:500;">${claimant}</span>
                  </td>
                </tr>
                ${contactRows}
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:12px;color:#5C636B;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">State</span><br/>
                    <span style="font-size:15px;color:#F2F4F5;font-weight:500;">${lead.state}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:12px;color:#5C636B;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Case type</span><br/>
                    <span style="font-size:15px;color:#F2F4F5;font-weight:500;">${caseLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size:12px;color:#5C636B;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Price</span><br/>
                    <span style="font-size:15px;color:#5BE1EF;font-weight:600;">${price}</span>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://semperr.com/login" style="display:inline-block;background:#F2F4F5;color:#0A0B0D;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.01em;">
                      Review lead &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="font-size:12px;color:#3a3f45;margin:0;line-height:1.6;">
                Semperr &mdash; Exclusive legal leads, delivered.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

export async function sendFirmApprovedEmail(
  to: string,
  firmName: string,
  contactName: string | null,
  tier: number,
) {
  const firstName = contactName?.split(" ")[0] ?? "there";
  const tierText = tierLabel(tier);
  const tierDescription = tierCopy(tier);

  await resend.emails.send({
    from: "Semperr <no-reply@semperr.com>",
    to,
    subject: `${firmName} has been manually approved`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0B0D;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0B0D;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:40px;">
              <span style="font-size:14px;letter-spacing:0.3em;text-transform:uppercase;color:#6b727a;font-weight:400;">SEMPERR</span>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#111214;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:44px 40px;">
              <!-- Status badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:rgba(70,208,138,0.1);border:1px solid rgba(70,208,138,0.25);border-radius:20px;padding:6px 14px;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#46D08A;margin-right:8px;vertical-align:middle;"></span>
                    <span style="font-size:12px;color:#46D08A;font-weight:600;letter-spacing:0.04em;vertical-align:middle;">APPROVED</span>
                  </td>
                </tr>
              </table>

              <h1 style="font-size:26px;color:#F2F4F5;font-weight:700;margin:0 0 14px;line-height:1.3;">
                Hey ${firstName}, your account has been manually approved.
              </h1>
              <p style="font-size:15px;color:#888F96;line-height:1.7;margin:0 0 32px;">
                <strong style="color:#F2F4F5;">${firmName}</strong> has been reviewed by our team. Your relationship manager is <strong style="color:#F2F4F5;">${RELATIONSHIP_MANAGER_NAME}</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom:16px;">
                    <span style="display:inline-block;background:rgba(91,225,239,0.12);border:1px solid rgba(91,225,239,0.22);border-radius:999px;padding:6px 12px;font-size:12px;color:#5BE1EF;font-weight:600;letter-spacing:0.04em;">${tierText}</span>
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;color:#888F96;line-height:1.7;margin:0 0 20px;">
                ${tierDescription}
              </p>

              <p style="font-size:15px;color:#888F96;line-height:1.7;margin:0;">
                Your account will automatically activate in about 3 hours. When that happens, we’ll send your welcome email and lead delivery can begin as soon as your payment method is valid.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="font-size:12px;color:#3a3f45;margin:0;line-height:1.6;">
                Semperr &mdash; Exclusive legal leads, delivered.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string | null,
  firmName: string,
) {
  const greeting = firstName?.trim() || "there";

  await resend.emails.send({
    from: "Semperr <no-reply@semperr.com>",
    to,
    subject: `Welcome to Semperr, ${firmName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0B0D;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0B0D;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="padding-bottom:40px;">
              <span style="font-size:14px;letter-spacing:0.3em;text-transform:uppercase;color:#6b727a;font-weight:400;">SEMPERR</span>
            </td>
          </tr>
          <tr>
            <td style="background:#111214;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:44px 40px;">
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:rgba(91,225,239,0.1);border:1px solid rgba(91,225,239,0.25);border-radius:20px;padding:6px 14px;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#5BE1EF;margin-right:8px;vertical-align:middle;"></span>
                    <span style="font-size:12px;color:#5BE1EF;font-weight:600;letter-spacing:0.04em;vertical-align:middle;">WELCOME</span>
                  </td>
                </tr>
              </table>
              <h1 style="font-size:26px;color:#F2F4F5;font-weight:700;margin:0 0 14px;line-height:1.3;">
                Welcome, ${greeting}.
              </h1>
              <p style="font-size:15px;color:#888F96;line-height:1.7;margin:0 0 28px;">
                Your ${firmName} account has been created and is waiting on manual approval. We’ll let you know as soon as it’s been reviewed.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://semperr.com/login" style="display:inline-block;background:#F2F4F5;color:#0A0B0D;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.01em;">
                      Sign in &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="font-size:12px;color:#3a3f45;margin:0;line-height:1.6;">
                Semperr &mdash; Exclusive legal leads, delivered.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim(),
  });
}

export async function sendFirmActivatedEmail(
  to: string,
  firmName: string,
  contactName: string | null,
  tier: number,
) {
  const firstName = contactName?.split(" ")[0] ?? "there";
  const tierText = tierLabel(tier);
  const tierDescription = tierCopy(tier);

  await resend.emails.send({
    from: "Semperr <no-reply@semperr.com>",
    to,
    subject: `${firmName} is now active`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0B0D;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0B0D;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="padding-bottom:40px;">
              <span style="font-size:14px;letter-spacing:0.3em;text-transform:uppercase;color:#6b727a;font-weight:400;">SEMPERR</span>
            </td>
          </tr>
          <tr>
            <td style="background:#111214;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:44px 40px;">
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:rgba(91,225,239,0.1);border:1px solid rgba(91,225,239,0.25);border-radius:20px;padding:6px 14px;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#5BE1EF;margin-right:8px;vertical-align:middle;"></span>
                    <span style="font-size:12px;color:#5BE1EF;font-weight:600;letter-spacing:0.04em;vertical-align:middle;">ACTIVE</span>
                  </td>
                </tr>
              </table>
              <h1 style="font-size:26px;color:#F2F4F5;font-weight:700;margin:0 0 14px;line-height:1.3;">
                Welcome, ${firstName}. Your account is live.
              </h1>
              <p style="font-size:15px;color:#888F96;line-height:1.7;margin:0 0 20px;">
                <strong style="color:#F2F4F5;">${firmName}</strong> is now ungated and ready to receive leads when your payment status and buying rules allow it.
              </p>
              <p style="font-size:15px;color:#888F96;line-height:1.7;margin:0 0 20px;">
                ${tierText} applies to your account.
              </p>
              <p style="font-size:15px;color:#888F96;line-height:1.7;margin:0;">
                ${tierDescription}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="font-size:12px;color:#3a3f45;margin:0;line-height:1.6;">
                Semperr &mdash; Exclusive legal leads, delivered.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
