/**
 * Cola de temas pendientes para /api/cron/tutorials. El cron toma el
 * primero que no exista ya como slug en la tabla `tutorials` y genera esa
 * nota; una vez agotada la lista, deja de publicar (no repite temas).
 */
export const TUTORIAL_TOPICS: { slug: string; topic: string }[] = [
  { slug: "que-es-el-sharpe-ratio", topic: "Qué es el Sharpe ratio y cómo interpretarlo" },
  { slug: "acciones-vs-etfs", topic: "Diferencia entre comprar una acción y un ETF" },
  { slug: "que-es-el-drawdown", topic: "Qué es el drawdown máximo y por qué es la métrica de riesgo más honesta" },
  { slug: "interes-compuesto", topic: "Cómo funciona el interés compuesto a largo plazo" },
  { slug: "que-es-un-dividendo", topic: "Qué es un dividendo y cómo afecta el precio de una acción" },
  { slug: "dca-costo-promedio", topic: "Qué es el costo promedio en dólares (DCA) y cuándo conviene" },
  { slug: "correlacion-entre-activos", topic: "Qué es la correlación entre activos y por qué le importa a un portafolio" },
  { slug: "riesgo-sistemico-vs-especifico", topic: "Riesgo sistemático vs riesgo específico de un activo" },
  { slug: "que-es-la-capitalizacion-de-mercado", topic: "Qué es la capitalización de mercado y por qué separa a las empresas 'large cap' de las 'small cap'" },
  { slug: "que-es-un-stop-loss", topic: "Qué es un stop-loss y sus límites reales" },
  { slug: "rebalanceo-de-portafolio", topic: "Qué es rebalancear un portafolio y cada cuánto tiene sentido hacerlo" },
  { slug: "que-es-la-inflacion-y-tus-inversiones", topic: "Cómo la inflación afecta el retorno real de tus inversiones" },
  { slug: "bonos-basico", topic: "Cómo funciona un bono y por qué su precio sube cuando bajan las tasas" },
  { slug: "que-es-el-value-at-risk", topic: "Qué es el Value at Risk (VaR) y sus límites" },
  { slug: "sesgos-comunes-al-invertir", topic: "Los sesgos psicológicos más comunes al invertir (aversión a la pérdida, sesgo de confirmación)" },
];
