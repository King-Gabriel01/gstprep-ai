// Sends transactional emails via Resend's HTTPS API (no SDK dependency needed).

const RESEND_API_URL = 'https://api.resend.com/emails';
// Resend's free tier only allows sending from this shared test address
// unless a custom domain has been verified on the account.
const FROM_ADDRESS = process.env.EMAIL_FROM || 'GSTPrep AI <onboarding@resend.dev>';

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set; skipping email send.');
    return { skipped: true };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Resend API request failed (${response.status}): ${errBody.slice(0, 300)}`);
  }

  return response.json();
}

async function sendVerificationEmail({ to, firstName, verifyUrl }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #14231F;">Verify your GSTPrep AI account</h2>
      <p>Hi ${firstName},</p>
      <p>Thanks for signing up. Please confirm your email address to activate your account.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: #4A9B7F; color: #fff; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 600;">
          Verify my email
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Verify your GSTPrep AI account', html });
}

module.exports = { sendEmail, sendVerificationEmail };
