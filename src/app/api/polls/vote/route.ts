import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const vote: string | undefined = body?.vote;
  if (vote !== "bullish" && vote !== "bearish") {
    return NextResponse.json({ error: "Voto inválido." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("sentiment_votes")
    .upsert({ user_id: user.id, vote_date: today, vote }, { onConflict: "user_id,vote_date" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: votes } = await supabase
    .from("sentiment_votes")
    .select("vote")
    .eq("vote_date", today);

  const bullish = (votes ?? []).filter((v) => v.vote === "bullish").length;
  const bearish = (votes ?? []).filter((v) => v.vote === "bearish").length;

  return NextResponse.json({ vote, bullish, bearish });
}
