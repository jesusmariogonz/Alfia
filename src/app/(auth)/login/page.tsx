import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmacion?: string }>;
}) {
  const { confirmacion } = await searchParams;

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Entra a tu cuenta para ver tu dashboard y tus créditos."
    >
      {confirmacion === "invalida" && (
        <p className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-sm text-gold">
          Ese enlace de confirmación ya no es válido — puede que ya lo hayas
          usado antes. Si es así, tu cuenta ya está confirmada: inicia sesión
          abajo con tu correo y contraseña.
        </p>
      )}
      <AuthForm mode="login" />
    </AuthShell>
  );
}
