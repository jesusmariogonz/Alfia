# Alfia

Análisis de mercado, señales y simulación — con IA, a demanda.

Plataforma web de análisis de mercado financiero potenciada por IA. Los
usuarios consultan análisis, corren simulaciones y reciben interpretaciones
en lenguaje natural, pagando con un sistema de créditos. El sitio se
mantiene estrictamente dentro del dominio de inversión/trading/finanzas y
todo el contenido de IA lleva disclaimer de que no es asesoría financiera
regulada.

## Stack

- **Frontend/Backend**: Next.js (App Router) + Tailwind CSS v4
- **Base de datos / Auth**: Supabase (Postgres + Auth) — próxima fase
- **Pagos**: Stripe (suscripciones + paquetes de créditos) — próxima fase
- **IA**: router de modelos (modelo barato para tareas repetitivas, modelo
  de mayor calidad para consultas complejas) — próxima fase

## Estructura de carpetas

```
src/
  app/                    # Rutas (App Router)
    page.tsx              # Landing pública
    layout.tsx            # Layout raíz + fuentes
    globals.css           # Tokens de diseño (colores, tipografía)
    icon.svg              # Favicon (isotipo de marca)
    (auth)/                # [Fase 1] /login, /registro
    (app)/                 # [Fase 1] Dashboard autenticado
      dashboard/
      chat/
      creditos/
    api/                   # [Fase 1+] API routes
      ai/                  # Endpoint de chat con router de modelos
      credits/             # Descuento/consulta de créditos
      stripe/
        webhook/           # Webhook de recarga de créditos
  components/
    brand/                 # LogoMark, LogoLockup
    ui/                    # Button, Badge, Disclaimer, primitivos
    marketing/             # Secciones de la landing
    dashboard/             # [Fase 1] Componentes del dashboard
  lib/
    supabase/              # [Fase 1] Clientes de Supabase
    stripe/                # [Fase 1] Cliente de Stripe
    ai/                    # [Fase 1] Router de modelos, prompts, guardrails
    credits/               # [Fase 1] Lógica de transacciones atómicas
  types/                   # Tipos compartidos
```

Las fases posteriores (Montecarlo, comparador de activos, screener,
watchlist, alertas, backtesting) se agregan como subcarpetas dentro de
`app/(app)` y `lib/` conforme se implementan.

## Sistema de diseño

Los design tokens viven en `src/app/globals.css` como variables CSS,
expuestas a Tailwind vía `@theme inline`. Paleta:

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#14171A` | Fondo principal |
| `--surface` / `--surface-2` | `#1B1F23` / `#20252A` | Tarjetas, paneles |
| `--border` | `#2A2F35` | Bordes, divisores |
| `--text` / `--text-muted` | `#E8EAED` / `#8B939B` | Texto |
| `--green` / `--green-bright` | `#2FA86B` / `#34C77B` | Marca / UI interactiva |
| `--data-up` / `--data-down` | `#4ADE80` / `#F2545B` | Solo datos de mercado |
| `--gold` | `#D9A94E` | Créditos, tier premium |

**Regla clave**: `--green-bright` (marca/UI) y `--data-up` (dato de mercado)
son intencionalmente distintos — nunca reutilizar uno por el otro.

Tipografía: `--font-display` (Space Grotesk), `--font-body` (Inter),
`--font-data` (JetBrains Mono, para precios/créditos/tickers).

## Getting Started

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).
