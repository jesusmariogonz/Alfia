import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, NEWSLETTER_FROM } from "@/lib/email/resend";
import { buildWeeklyNewsletter } from "@/lib/content/newsletter";

/**
 * Dispara el envío del newsletter semanal. Pensado para llamarse desde
 * Vercel Cron (ver vercel.json), que agrega automáticamente el header
 * `Authorization: Bearer $CRON_SECRET` cuando esa variable de entorno
 * existe — no requiere sesión de usuario porque nadie está navegando
 * cuando se dispara. Para probarlo a mano: `curl -H "Authorization: Bearer
 * $CRON_SECRET" https://tu-dominio.com/api/cron/newsletter`.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json({
      sent: 0,
      message:
        "RESEND_API_KEY no está configurada; el newsletter no se envió. Configúrala para habilitar el envío.",
    });
  }

  const admin = createAdminClient();
  const { data: subscribers, error } = await admin
    .from("newsletter_subscribers")
    .select("id, email")
    .is("unsubscribed_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ sent: 0, message: "No hay suscriptores activos." });
  }

  const { subject, html } = await buildWeeklyNewsletter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let sent = 0;
  for (const subscriber of subscribers) {
    const personalizedHtml = html.replace(
      "{{unsubscribe_url}}",
      `${siteUrl}/api/newsletter/unsubscribe?id=${subscriber.id}`,
    );
    const { error: sendError } = await resend.emails.send({
      from: NEWSLETTER_FROM,
      to: subscriber.email,
      subject,
      html: personalizedHtml,
    });
    if (!sendError) sent++;
  }

  return NextResponse.json({ sent, total: subscribers.length });
}
