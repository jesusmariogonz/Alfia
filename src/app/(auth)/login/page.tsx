import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Entra a tu cuenta para ver tu dashboard y tus créditos."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
