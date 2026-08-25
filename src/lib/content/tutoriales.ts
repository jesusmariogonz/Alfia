export type Tutorial = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  content: string[];
};

export const TUTORIALS: Tutorial[] = [
  {
    slug: "que-es-la-volatilidad",
    title: "Qué es la volatilidad y por qué importa",
    summary: "Entiende qué mide la volatilidad y cómo usarla para dimensionar el riesgo de una inversión.",
    minutes: 4,
    content: [
      "La volatilidad mide qué tanto se mueve el precio de un activo respecto a su promedio. No indica si un activo va a subir o bajar — solo qué tan grandes pueden ser sus movimientos.",
      "Un activo con volatilidad anualizada de 15% se mueve, en un año típico, dentro de un rango relativamente angosto alrededor de su tendencia. Uno con 60% puede tener oscilaciones mucho más bruscas en cualquier dirección.",
      "En Alfia verás la volatilidad anualizada en la ficha de cada activo y en el screener. Es útil para comparar el 'nivel de montaña rusa' de dos inversiones antes de decidir cuánto capital destinarles.",
      "Una volatilidad alta no es necesariamente mala: activos más volátiles suelen (aunque no siempre) ofrecer mayor retorno potencial a cambio de mayor incertidumbre en el camino.",
    ],
  },
  {
    slug: "leer-una-simulacion-de-montecarlo",
    title: "Cómo leer una simulación de Montecarlo",
    summary: "El simulador te da percentiles, no una predicción única. Aquí te explicamos cómo interpretarlos.",
    minutes: 5,
    content: [
      "Una simulación de Montecarlo corre miles de escenarios posibles para tu inversión, cada uno con una combinación distinta (pero plausible) de rendimientos diarios.",
      "El resultado se resume en percentiles: el percentil 50 (mediana) es el escenario 'del medio' — la mitad de las simulaciones terminaron mejor y la mitad peor. El percentil 5 muestra un escenario pesimista, y el 95 uno optimista.",
      "La 'probabilidad de pérdida' te dice en qué porcentaje de los escenarios simulados terminaste con menos dinero del que empezaste. No es una certeza sobre el futuro — es una forma de dimensionar qué tan amplio es el rango de resultados posibles.",
      "Úsalo para calibrar expectativas, no para predecir un número exacto: ninguna simulación sabe qué va a pasar mañana, pero te ayuda a entender el abanico razonable de desenlaces dado el comportamiento histórico del activo.",
    ],
  },
  {
    slug: "backtesting-para-principiantes",
    title: "Backtesting para principiantes",
    summary: "Qué es probar una estrategia contra el pasado, y sus límites más importantes.",
    minutes: 4,
    content: [
      "Backtesting significa aplicar las reglas de una estrategia (por ejemplo, 'comprar cuando el precio cruza arriba de su media móvil de 50 días') sobre datos históricos, para ver qué resultado hubiera dado.",
      "Es útil para descartar rápidamente ideas que claramente no funcionan, y para entender cómo se hubiera comportado una estrategia en distintos periodos de mercado.",
      "Su limitación más importante: el hecho de que algo haya funcionado en el pasado no garantiza que funcione en el futuro. Además, un backtest simple no incluye comisiones, impuestos ni la dificultad real de ejecutar cada operación en el momento exacto.",
      "En Alfia, el número de 'operaciones' que arroja un backtest es una pista clave: entre más operaciones genera una estrategia, más sensible es a esos costos que el backtest no está midiendo.",
    ],
  },
  {
    slug: "diversificacion-basica",
    title: "Diversificación: no pongas todo en un solo activo",
    summary: "La idea más simple y más repetida en inversión, explicada sin rodeos.",
    minutes: 3,
    content: [
      "Diversificar significa repartir tu dinero entre distintos activos para que el mal desempeño de uno no arrastre todo tu portafolio.",
      "Funciona mejor cuando combinas activos que no se mueven exactamente igual (baja correlación): si uno cae, otro puede mantenerse estable o subir, amortiguando el golpe.",
      "No elimina el riesgo por completo — si todo el mercado cae, la mayoría de los activos caen juntos — pero sí reduce el riesgo específico de que una sola mala decisión defina tu resultado.",
      "El comparador de activos de Alfia es un buen punto de partida para ver, lado a lado, qué tan distinto se comportan dos inversiones que estás considerando combinar.",
    ],
  },
];

export function findTutorial(slug: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}
