import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDeepReport } from "@/lib/analytics/deep-report";

/**
 * Genera el reporte diario detallado (formato largo, ver deep-report.ts),
 * una vez al día después del cierre de mercado. Se guarda con
 * report_date = hoy, sobreescribiendo si ya existía (útil para pruebas
 * manuales sin duplicar filas).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const content = await generateDeepReport();
  if (!content) {
    return NextResponse.json({
      published: false,
      reason: "ANTHROPIC_API_KEY no configurada o Claude no respondió.",
    });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await admin
    .from("daily_deep_reports")
    .upsert({ report_date: today, content }, { onConflict: "report_date" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ published: true, date: today, hook: content.hook });
}
