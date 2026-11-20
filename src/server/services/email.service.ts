import nodemailer from "nodemailer";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("[EMAIL] Would send to:", payload.to);
    console.log("[EMAIL] Subject:", payload.subject);
    return;
  }

  const transport = createTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

// Pre-built email templates
export function milestoneEmail(firstName: string, tierName: string, certUrl: string) {
  return {
    subject: `🎉 Congratulations! You've reached ${tierName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a56db; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Truehost Campus Builders</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb;">
          <h2>Congratulations, ${firstName}! 🚀</h2>
          <p>You have officially achieved <strong>${tierName}</strong> status in the Truehost Campus Builders programme.</p>
          <p>Your certificate has been generated and is ready to download.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${certUrl}" 
               style="background: #1a56db; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Download Your Certificate
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Share your achievement on LinkedIn and tag @TruehostCloud!
          </p>
        </div>
      </div>
    `,
  };
}

export function activityApprovedEmail(firstName: string, activityTitle: string, points: number) {
  return {
    subject: `✅ Activity approved: ${activityTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2>Hi ${firstName},</h2>
        <p>Your activity submission <strong>"${activityTitle}"</strong> has been approved.</p>
        <p>You have been awarded <strong>${points} points</strong>.</p>
        <p>Log in to your dashboard to view your updated ranking.</p>
      </div>
    `,
  };
}

export function activityRejectedEmail(firstName: string, activityTitle: string, feedback: string) {
  return {
    subject: `Activity submission update: ${activityTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2>Hi ${firstName},</h2>
        <p>Your activity submission <strong>"${activityTitle}"</strong> requires attention.</p>
        <p><strong>Reviewer feedback:</strong></p>
        <blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; color: #374151;">
          ${feedback}
        </blockquote>
        <p>Log in to your dashboard to update and resubmit.</p>
      </div>
    `,
  };
}
