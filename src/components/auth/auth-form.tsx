"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type AuthFormProps = {
  mode: "login" | "registro";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "registro") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      setLoading(false);
      if (error) {
        setError(traducirError(error.message));
        return;
      }
      setNotice(
        "Cuenta creada. Revisa tu correo para confirmar tu dirección antes de iniciar sesión.",
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(traducirError(error.message));
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-text-muted">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-green-bright focus:outline-none"
          placeholder="tu@correo.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-text-muted">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-green-bright focus:outline-none"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-data-down/30 bg-data-down/10 px-3.5 py-2.5 text-sm text-data-down">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-green/30 bg-green/10 px-3.5 py-2.5 text-sm text-green-bright">
          {notice}
        </p>
      )}

      <Button type="submit" disabled={loading} className="mt-1 w-full py-2.5">
        {loading
          ? "Un momento…"
          : mode === "login"
            ? "Iniciar sesión"
            : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-text-muted">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-green-bright hover:underline">
              Regístrate gratis
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-green-bright hover:underline">
              Inicia sesión
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function traducirError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.";
  }
  if (message.includes("User already registered")) {
    return "Ya existe una cuenta con este correo. Intenta iniciar sesión.";
  }
  if (message.includes("Password should be")) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  return message;
}
