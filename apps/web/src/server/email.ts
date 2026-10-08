import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

const host = process.env.SMTP_HOST || "localhost";
const port = Number(process.env.SMTP_PORT || 1025);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM || "Quick2Learn <noreply@quick2learn.in>";

export const mailer = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  ...(user && pass
    ? {
        auth: {
          user,
          pass,
        },
      }
    : {}),
});

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const info = await mailer.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
  return info;
}
