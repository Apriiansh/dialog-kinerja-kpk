import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER ?? process.env.GMAIL_USER ?? "";
const smtpUser = process.env.GMAIL_USER ?? process.env.EMAIL_USER ?? "";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: smtpUser,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return transporter.sendMail({
    from: `"developer.dialogkinerja" <${emailUser}>`,
    to,
    subject,
    html,
  });
}
