import { createClient } from "@/lib/supabase/server";
import { ChatPanel } from "@/components/dashboard/chat-panel";
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

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">
        Chat de inversión
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Responde solo preguntas de inversión, trading y finanzas.
      </p>
      <div className="mt-6">
        <ChatPanel initialBalance={profile?.credit_balance ?? 0} />
      </div>
    </div>
  );
}
