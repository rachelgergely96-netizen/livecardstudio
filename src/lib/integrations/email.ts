import { Resend } from 'resend';
import { env } from '@/lib/env';

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail({ to, subject, html, text }: EmailInput) {
  if (!resend) {
    if (env.NODE_ENV !== 'production') {
      console.info('[email:dev-fallback]', { to, subject });
      return { id: 'dev-fallback' };
    }
    throw new Error('RESEND_API_KEY is missing');
  }

  const from = env.RESEND_FROM_EMAIL || 'LiveCardStudio <hello@livecardstudio.com>';
  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function sendAdminAlert(input: {
  subject: string;
  summary: string;
  details?: Record<string, unknown>;
}) {
  if (!env.ADMIN_ALERT_EMAIL) {
    if (env.NODE_ENV !== 'production') {
      console.info('[admin-alert:dev-fallback]', input);
      return;
    }
    return;
  }

  const detailsJson = input.details ? JSON.stringify(input.details, null, 2) : '';
  await sendEmail({
    to: env.ADMIN_ALERT_EMAIL,
    subject: input.subject,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#fdf8f0;color:#3a2f2a;">
        <div style="max-width:680px;margin:0 auto;background:#fffaf3;border:1px solid rgba(200,160,120,0.2);border-radius:16px;padding:28px;">
          <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8b6f5e;margin:0 0 10px;">LiveCardStudio Admin Alert</p>
          <h1 style="font-size:24px;margin:0 0 12px;">${input.subject}</h1>
          <p style="font-size:15px;line-height:1.5;color:#5a4a3f;margin:0;">${input.summary}</p>
          ${
            detailsJson
              ? `<pre style="margin-top:16px;background:#fff;padding:12px;border-radius:10px;border:1px solid rgba(200,160,120,0.2);font-size:12px;line-height:1.4;white-space:pre-wrap;">${detailsJson}</pre>`
              : ''
          }
        </div>
      </div>
    `,
    text: `${input.subject}\n\n${input.summary}\n\n${detailsJson}`
  });
}

export function buildMagicLinkEmail(url: string) {
  return {
    subject: 'Open your LiveCardStudio',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#fdf8f0;color:#3a2f2a;">
        <div style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid rgba(200,160,120,0.2);border-radius:16px;padding:28px;">
          <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8b6f5e;margin:0 0 10px;">LiveCardStudio</p>
          <h1 style="font-family:Georgia,serif;font-weight:500;margin:0 0 12px;">Your studio is ready</h1>
          <p style="font-size:16px;line-height:1.55;color:#5a4a3f;">Tap below to sign in securely and continue creating your living card.</p>
          <a href="${url}" style="display:inline-block;margin-top:18px;padding:12px 20px;background:#c87941;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Open your studio</a>
        </div>
      </div>
    `,
    text: `Open your studio: ${url}`
  };
}

export function buildPasswordResetEmail(input: { resetUrl: string }) {
  return {
    subject: 'Reset your LiveCardStudio password',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#fdf8f0;color:#3a2f2a;">
        <div style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid rgba(200,160,120,0.2);border-radius:16px;padding:28px;">
          <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8b6f5e;margin:0 0 10px;">LiveCardStudio</p>
          <h1 style="font-family:Georgia,serif;font-weight:500;margin:0 0 12px;">Reset your password</h1>
          <p style="font-size:16px;line-height:1.55;color:#5a4a3f;">Tap below to set a new password. This link expires in 30 minutes.</p>
          <a href="${input.resetUrl}" style="display:inline-block;margin-top:18px;padding:12px 20px;background:#c87941;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Reset password</a>
          <p style="margin-top:18px;font-size:13px;line-height:1.5;color:#8b6f5e;">If you did not request this, you can ignore this email.</p>
        </div>
      </div>
    `,
    text: `Reset your password: ${input.resetUrl}\n\nThis link expires in 30 minutes.`
  };
}

export function buildFirstViewOpenedEmail(input: {
  recipientName: string;
  viewedAtIso: string;
  statsUrl: string;
}) {
  return {
    subject: `Your card for ${input.recipientName} was opened`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#fdf8f0;color:#3a2f2a;">
        <div style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid rgba(200,160,120,0.2);border-radius:16px;padding:28px;">
          <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8b6f5e;margin:0 0 10px;">LiveCardStudio</p>
          <h1 style="font-size:28px;margin:0 0 12px;">Your card was opened</h1>
          <p style="font-size:16px;line-height:1.55;color:#5a4a3f;margin:0;">
            ${input.recipientName} opened their card on ${input.viewedAtIso}.
          </p>
          <a href="${input.statsUrl}" style="display:inline-block;margin-top:18px;padding:12px 20px;background:#c87941;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Open card stats</a>
        </div>
      </div>
    `,
    text: `${input.recipientName} opened their card on ${input.viewedAtIso}. View details: ${input.statsUrl}`
  };
}
