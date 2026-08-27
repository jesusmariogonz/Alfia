import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/app-shell";
import { PublicPreviewShell } from "@/components/marketing/public-preview-shell";

/**
 * Screener y ficha de activo son las únicas páginas de producto visibles
 * sin cuenta (ver README — es el gancho de adquisición: dato real antes de
 * pedir registro). Con sesión, se ven exactamente igual que el resto de la
 * app (mismo shell); sin sesión, se envuelven en el shell público con
 * banner de registro en vez del sidebar.
 */
export default async function PublicPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PublicPreviewShell>{children}</PublicPreviewShell>;
  }

  return (
    <AppShell email={user.email ?? ""}>
      {children}
    </AppShell>
  );
}
