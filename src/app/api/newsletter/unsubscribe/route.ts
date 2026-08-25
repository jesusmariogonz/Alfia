import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!id) {
    return NextResponse.redirect(`${siteUrl}/?newsletter=error`);
  }

  const admin = createAdminClient();
  await admin
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.redirect(`${siteUrl}/?newsletter=baja`);
}
