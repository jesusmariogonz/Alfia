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
cp .env.example .env.local   # completa las claves de Supabase (y Anthropic si quieres probar el chat)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Base de datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` del panel a
   `.env.local`.
3. Corre la migración `supabase/migrations/0001_init.sql` en el SQL editor del
   proyecto (o vía `supabase db push` si usas la CLI). Crea:
   - `profiles`: perfil + balance de créditos por usuario.
   - `credit_transactions`: libro contable de créditos (append-only).
   - `ai_usage_log`: auditoría de cada consulta a la IA (usuario, modelo,
     tokens, créditos cobrados).
   - Un trigger que crea el perfil con 20 créditos de bienvenida al registrarse.
   - Las funciones `charge_credits` / `grant_credits`: descuentan o recargan
     créditos de forma atómica (bloqueo de fila + validación de saldo), para
     que el balance nunca quede negativo aunque el usuario dispare varias
     consultas a la vez.

### Pagos (Stripe)

1. Crea una cuenta en [stripe.com](https://stripe.com) (modo test sirve para
   desarrollo) y copia `STRIPE_SECRET_KEY` a `.env.local`.
2. Los precios de planes y paquetes de créditos se definen en código
   (`src/lib/stripe/config.ts`), como `price_data` inline — no hace falta
   crear Products/Prices en el dashboard de Stripe para empezar.
3. Corre `stripe listen --forward-to localhost:3000/api/stripe/webhook` con la
   [Stripe CLI](https://stripe.com/docs/stripe-cli) para desarrollo local, y
   copia el `whsec_...` que imprime a `STRIPE_WEBHOOK_SECRET`. En producción,
   crea el endpoint de webhook en el dashboard apuntando a
   `https://tu-dominio.com/api/stripe/webhook` con los eventos
   `checkout.session.completed`, `invoice.payment_succeeded` y
   `customer.subscription.deleted`.
4. El webhook usa `SUPABASE_SERVICE_ROLE_KEY` (cliente admin, sin RLS) para
   recargar créditos y actualizar el plan del usuario — asegúrate de tenerla
   en `.env.local` también.

Flujo: `/api/stripe/checkout` crea (o reutiliza) el customer de Stripe y una
Checkout Session; el webhook, al confirmarse el pago, llama a `grantCredits`
(la misma función atómica que usa el resto del sistema de créditos) y
actualiza `profiles.plan`. Las renovaciones mensuales de suscripción se
recargan vía `invoice.payment_succeeded`; al cancelar, `customer.subscription.deleted`
regresa el plan a `free`.

### Datos de mercado (Fase 2)

`src/lib/market-data` es el único punto de acceso a precios/series
históricas. Hoy está respaldado por un generador sintético determinista
(`synthetic.ts`, seed por símbolo — el mismo activo siempre da la misma
serie) sobre un universo de ~15 tickers de ejemplo (`universe.ts`). Cuando se
conecte Polygon.io o Finnhub, solo `getCloses`/`getQuote` en
`market-data/index.ts` cambian de implementación — el resto del código
(analíticas, screener, comparador, Montecarlo, watchlist) no se toca.

Corre la migración `supabase/migrations/0002_watchlist.sql` además de la
0001 para habilitar la watchlist.

### Newsletter semanal (Fase 3)

1. Crea una cuenta en [resend.com](https://resend.com), verifica un dominio
   de envío y copia la API key a `RESEND_API_KEY`. Ajusta
   `NEWSLETTER_FROM_EMAIL` a una dirección de ese dominio.
2. Genera un secreto aleatorio para `CRON_SECRET` (ej. `openssl rand -hex 32`).
3. `vercel.json` ya define el cron semanal (lunes 13:00 UTC) apuntando a
   `/api/cron/newsletter`. Si despliegas en Vercel con un plan que soporte
   Cron Jobs, Vercel agrega automáticamente el header
   `Authorization: Bearer $CRON_SECRET` — no hay que configurar nada más ahí.
   Si no usas Vercel, necesitas un cron externo (GitHub Actions, cron-job.org,
   etc.) que llame `GET /api/cron/newsletter` semanalmente con ese mismo
   header.
4. Corre la migración `supabase/migrations/0004_newsletter.sql` para crear
   la tabla de suscriptores.

El contenido del correo hoy resume el movimiento semanal del universo
sintético de `lib/market-data` (ver nota de Fase 2) — cuando haya datos y
noticias reales, `lib/content/newsletter.ts` es el único archivo a
actualizar.

### Estado por fase

- **Fase 1 (completa)**: landing ✅, auth (registro/login con Supabase) ✅,
  dashboard con resumen diario + noticias (contenido de ejemplo, aún no
  generado automáticamente) ✅, chat de inversión con guardrails de dominio y
  descuento atómico de créditos ✅, historial de transacciones ✅, Stripe
  (suscripciones + compra de créditos + webhook) ✅. Pendiente: el job que
  genera el resumen diario y las noticias reales (hoy son contenido de
  ejemplo).
- **Fase 2 (completa)**: simulador de Montecarlo (`/simulador`, GBM con 2,000
  simulaciones + interpretación en lenguaje natural) ✅, comparador de
  activos (`/comparar`) ✅, screener con filtros por tipo/retorno/volatilidad
  (`/screener`, sin costo en créditos) ✅, ficha de activo con métricas de
  riesgo — retorno anualizado, volatilidad, Sharpe, máximo drawdown, VaR 95%
  (`/activos/[symbol]`) ✅, watchlist persistida por usuario (`/watchlist`) ✅.
  Pendiente: alertas por email/notificación (fase 2 original) — no se
  implementó todavía porque requiere un proveedor de email y un job en
  segundo plano (colas/cron) que aún no está configurado en el proyecto.
- **Fase 3 (completa)**: backtesting simple de estrategias descritas en
  lenguaje natural (`/backtesting`, IA extrae la estrategia y la corre contra
  comprar-y-mantener) ✅, Alfia Score — rating propio 0-100 por activo,
  visible en el screener y en la ficha de cada activo ✅, contenido
  educativo público — glosario y tutoriales en `/aprende`, fuera del login,
  pensado como gancho de SEO/tráfico orgánico ✅, newsletter semanal
  automatizada con suscripción desde el footer de la landing y envío vía
  cron ✅.

### Pendientes de configuración (todas las fases)

Todo lo que necesitas hacer tú (claves, servicios externos, pasos manuales)
para que cada pieza funcione en un entorno real:

1. **Supabase**: crear el proyecto y correr, en orden, las 4 migraciones de
   `supabase/migrations/` (0001 perfiles/créditos, 0002 watchlist, 0003
   check constraint de backtest, 0004 newsletter). Completar
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY`.
2. **Stripe**: completar `STRIPE_SECRET_KEY`; configurar el webhook (local con
   `stripe listen` o en producción desde el dashboard) apuntando a
   `/api/stripe/webhook` con los eventos `checkout.session.completed`,
   `invoice.payment_succeeded` y `customer.subscription.deleted`; completar
   `STRIPE_WEBHOOK_SECRET`.
3. **IA (Anthropic)**: completar `ANTHROPIC_API_KEY`. Sin esta clave, el chat,
   el simulador de Montecarlo, el comparador y el backtesting funcionan pero
   devuelven un aviso de "IA no configurada" en vez de la interpretación en
   lenguaje natural.
4. **Datos de mercado reales**: hoy todo corre sobre datos sintéticos
   (`lib/market-data`). Cuando quieras precios reales, contratar Polygon.io o
   Finnhub, completar `POLYGON_API_KEY`, y reemplazar la implementación de
   `getCloses`/`getQuote` en `lib/market-data/index.ts` — es un cambio
   aislado a ese archivo.
5. **Newsletter**: cuenta y dominio verificado en Resend
   (`RESEND_API_KEY`, `NEWSLETTER_FROM_EMAIL`), generar `CRON_SECRET`, y
   asegurarse de que algo dispare `/api/cron/newsletter` semanalmente (Vercel
   Cron si despliegas ahí — ya configurado en `vercel.json` — o un cron
   externo si no).
6. **Dominio de producción**: una vez tengas el dominio real, actualizar
   `NEXT_PUBLIC_SITE_URL` — se usa para los links de retorno de Stripe
   Checkout, el callback de confirmación de correo de Supabase Auth, y los
   links de baja del newsletter.
