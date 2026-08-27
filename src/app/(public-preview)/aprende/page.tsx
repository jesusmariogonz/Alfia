import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tutorial } from "@/types/database";

export const metadata = {
  title: "Aprende — Alfia",
  description: "Glosario y tutoriales cortos para entender inversión, trading y análisis de mercado.",
};

export default async function AprendePage() {
  const supabase = await createClient();
  const { data: tutorials } = await supabase
    .from("tutorials")
    .select("*")
    .order("published_at", { ascending: false })
    .returns<Tutorial[]>();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
        Aprende
      </h1>
      <p className="mt-3 text-text-muted">
        Contenido educativo corto para entender los conceptos detrás de las
        herramientas de Alfia. Información educativa, no asesoría financiera
        regulada.
      </p>

      <div className="mt-10 flex flex-col gap-6">
        <Link
          href="/aprende/glosario"
          className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-green-bright/40"
        >
          <h2 className="font-display text-lg font-medium text-text">Glosario</h2>
          <p className="mt-1.5 text-sm text-text-muted">
            Términos de inversión explicados en lenguaje simple.
          </p>
        </Link>

        <div>
          <h2 className="font-display text-lg font-medium text-text">Tutoriales</h2>
          <div className="mt-4 flex flex-col gap-4">
            {(tutorials ?? []).map((tutorial) => (
              <Link
                key={tutorial.slug}
                href={`/aprende/tutoriales/${tutorial.slug}`}
                className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-green-bright/40"
              >
                <p className="font-display font-medium text-text">{tutorial.title}</p>
                <p className="mt-1.5 text-sm text-text-muted">{tutorial.summary}</p>
                <p className="mt-2 font-data text-xs text-text-muted">
                  {tutorial.minutes} min de lectura
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
