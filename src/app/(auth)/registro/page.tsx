import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegistroPage() {
  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza gratis con 20 créditos de bienvenida."
    >
      <AuthForm mode="registro" />
    </AuthShell>
  );
}
