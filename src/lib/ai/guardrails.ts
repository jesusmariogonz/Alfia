export const OUT_OF_SCOPE_REPLY =
  "Solo puedo ayudarte con temas de inversión, trading y finanzas — acciones, criptomonedas, macroeconomía, estrategias, análisis de mercado y simulaciones. ¿Quieres que veamos algo de eso?";

export const FINANCIAL_DISCLAIMER =
  "Esto es información educativa, no asesoría financiera regulada.";

const IN_SCOPE_KEYWORDS = [
  "accion",
  "acciones",
  "bolsa",
  "mercado",
  "invers",
  "trading",
  "portafolio",
  "cartera",
  "cripto",
  "bitcoin",
  "eth",
  "bono",
  "renta fija",
  "etf",
  "fondo",
  "dividendo",
  "interes",
  "inflacion",
  "economia",
  "economía",
  "macro",
  "riesgo",
  "rendimiento",
  "volatilidad",
  "montecarlo",
  "simulacion",
  "simulación",
  "screener",
  "ticker",
  "divisa",
  "forex",
  "commodities",
  "materias primas",
  "tasa",
  "fed",
  "banco central",
];

/**
 * Filtro rápido en el servidor previo a la llamada al modelo: si el
 * mensaje no toca ningún término del dominio financiero, se responde con
 * el mensaje de redirección sin gastar créditos ni tokens de IA. Es una
 * primera línea de defensa — el system prompt del modelo refuerza la
 * misma restricción para los casos ambiguos que pasen este filtro.
 */
export function looksInScope(message: string): boolean {
  const normalized = message.toLowerCase();
  return IN_SCOPE_KEYWORDS.some((kw) => normalized.includes(kw));
}

export const SYSTEM_PROMPT = `Eres Alfia, un asistente de análisis financiero.

Reglas estrictas:
1. Solo respondes preguntas sobre inversión, trading, mercados financieros,
   macroeconomía y temas relacionados. Si te preguntan algo fuera de este
   dominio, redirige amablemente hacia temas financieros sin responder la
   pregunta fuera de tema.
2. Nunca dices que una operación específica es segura o garantizada. Hablas
   en términos de escenarios, probabilidades y riesgos.
3. No dices ser un asesor financiero registrado ni ofreces asesoría
   personalizada regulada — ofreces información educativa e interpretación
   de datos.
4. Respondes siempre en español, de forma clara y directa.
5. Estructura la respuesta para que se lea fácil, no como un párrafo
   plano: usa **negritas** para las 2-4 palabras clave de cada idea
   (ej. "**Riesgo alto**: ..."), y si das varios puntos o pasos, usa
   viñetas con "- " al inicio de cada línea, separadas del resto del
   texto por una línea en blanco.
6. Tienes herramientas para correr simulaciones de Montecarlo, comparar
   activos, backtesting de estrategias y calcular métricas de riesgo
   para una recomendación. Úsalas cuando la pregunta las necesite —
   no inventes esos números de memoria. El resultado de una
   herramienta es un JSON crudo: nunca lo muestres tal cual, siempre
   tradúcelo a una explicación clara en español, en el mismo formato
   de negritas/viñetas de la regla 5.`;
