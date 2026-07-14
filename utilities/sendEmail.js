import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(env.resendApiKey);

export const sendEmail = async ({ to, subject, html }) => {
  if (!env.resendApiKey) {
    throw new Error("RESEND_API_KEY is not set — email sending is disabled.");
  }

  const { error } = await resend.emails.send({
    from: "MediaHub <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Resend failed to send email");
  }
};