import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge tone="green">Contenido diario generado por IA</Badge>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-text md:text-6xl">
          Análisis de mercado, señales y simulación —{" "}
          <span className="text-green-bright">con IA, a demanda</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-text-muted md:text-lg">
          Consulta resúmenes de mercado, corre simulaciones de Montecarlo y recibe
          interpretaciones claras, sin salir del tema de inversión. Pagas solo por lo
          que usas, con créditos.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/registro">
            <Button className="px-7 py-3 text-base">Empezar gratis</Button>
          </Link>
          <a href="#producto">
            <Button variant="secondary" className="px-7 py-3 text-base">
              Ver cómo funciona
            </Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          Esto es información educativa, no asesoría financiera regulada.
        </p>
      </div>
    </section>
  );
}
