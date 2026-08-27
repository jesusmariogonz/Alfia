import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { CreditChip } from "@/components/dashboard/credit-chip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { canUseChat } from "@/lib/plan";
import type { Profile } from "@/types/database";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  if (!canUseChat(profile?.plan ?? "free")) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <Badge tone="gold">Pro</Badge>
        <p className="font-display text-lg font-medium text-text">
          El chat de inversión es una función de Pro
        </p>
        <p className="max-w-md text-sm text-text-muted">
          Pregunta lo que sea sobre tus activos y Alfia corre por su cuenta
          simulaciones de Montecarlo, comparaciones, backtests y recomendaciones —
          todo desde una sola conversación.
        </p>
        <Link href="/creditos">
          <Button>Ver planes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">
            Chat de inversión
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Responde solo preguntas de inversión, trading y finanzas.
          </p>
        </div>
        <CreditChip balance={profile?.credit_balance ?? 0} />
      </div>
      <div className="mt-6">
        <ChatPanel initialBalance={profile?.credit_balance ?? 0} />
      </div>
    </div>
  );
}
