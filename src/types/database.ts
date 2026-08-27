export type Plan = "free" | "basico" | "pro";

export type CreditReason =
  | "bienvenida"
  | "suscripcion"
  | "compra_paquete"
  | "consumo_ia"
  | "ajuste_manual";

export type QueryType =
  | "chat"
  | "resumen_diario"
  | "montecarlo"
  | "comparador"
  | "screener"
  | "backtest"
  | "recomendacion";

export type Profile = {
  id: string;
  email: string;
  plan: Plan;
  credit_balance: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WatchlistItem = {
  id: string;
  user_id: string;
  symbol: string;
  invested_usd: number | null;
  created_at: string;
};

export type Tutorial = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  content: string[];
  published_at: string;
  created_at: string;
};

export type BriefingType = "apertura" | "intradia" | "cierre";

export type MarketBriefing = {
  id: string;
  type: BriefingType;
  title: string;
  content: string[];
  refers_to: string | null;
  created_at: string;
};

export type NewsItem = {
  id: string;
  external_id: string;
  title: string;
  url: string;
  source: string;
  summary: string | null;
  sentiment: "positivo" | "negativo" | "neutral";
  published_at: string;
  created_at: string;
};

export type CreditTransaction = {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  reason: CreditReason;
  metadata: Record<string, unknown>;
  created_at: string;
};
