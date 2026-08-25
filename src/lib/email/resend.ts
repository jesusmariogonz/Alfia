import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export const NEWSLETTER_FROM =
  process.env.NEWSLETTER_FROM_EMAIL ?? "Alfia <newsletter@alfia.app>";
